import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import { getSetting, setSetting } from '@/models/SiteSettings';
import { requireAdmin, serverError, zodFail } from '@/lib/api-helpers';
import { getDictionary } from '@/lib/dictionaries';
import { IMAGE_SLOTS, DEFAULT_LINKS, SITE_CONTENT_KEYS, type ImageOverrides, type ImageSlotKey, type SiteLink } from '@/lib/site-content';
import { flattenEditable, flattenStrings, type SiteTextStore, type TextOverrides } from '@/lib/site-text';
import en from '@/i18n/dictionaries/en.json';

const LOCALES = ['en', 'fr', 'ar'] as const;
const SLOT_KEYS = Object.keys(IMAGE_SLOTS) as ImageSlotKey[];
/** Every string leaf of en.json: the only paths a text override may target */
const TEXT_PATHS = new Set(Object.keys(flattenStrings(en)));

const imageSrc = z
  .string()
  .trim()
  .max(2048)
  .refine((s) => (s.startsWith('/') && !s.startsWith('//')) || /^https:\/\/[^\s]+$/i.test(s), {
    message: 'Image source must be a site path starting with "/" or an https:// URL',
  });

const imageOverride = z.object({
  src: imageSrc,
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
  alt: z.string().max(300).optional(),
});

const textValue = z.string().max(2000, 'Text fields are limited to 2000 characters').nullable();

const textForLocale = z
  .record(z.string(), textValue)
  .refine((obj) => Object.keys(obj).every((k) => TEXT_PATHS.has(k)), { message: 'Unknown text field' });

const link = z.object({
  key: z.string().trim().min(1).max(60).regex(/^[a-z0-9_-]+$/i, 'Invalid link key'),
  label: z.string().trim().min(1, 'Every link needs a label').max(200),
  url: z
    .string()
    .trim()
    .max(2048)
    .refine((u) => /^https:\/\/[^\s]+$/i.test(u) || /^mailto:[^\s]+$/i.test(u), {
      message: 'Link URLs must start with https:// or mailto:',
    }),
  partner: z.boolean().optional(),
});

const putSchema = z.object({
  /** Per slot: an override, or null to go back to the default. Merged into what is stored. */
  images: z.partialRecord(z.enum(SLOT_KEYS as [ImageSlotKey, ...ImageSlotKey[]]), imageOverride.nullable()).optional(),
  /** Per locale, per dot-path: a string, or null / "" to go back to the default. Merged. */
  text: z.partialRecord(z.enum(LOCALES), textForLocale).optional(),
  /** The full list (replaces the stored one), or null to go back to the defaults. */
  links: z
    .array(link)
    .max(12, 'At most 12 links')
    .refine((ls) => new Set(ls.map((l) => l.key)).size === ls.length, { message: 'Duplicate link keys' })
    .nullable()
    .optional(),
});

async function readAll() {
  const [images, text, links] = await Promise.all([
    getSetting<ImageOverrides>(SITE_CONTENT_KEYS.images),
    getSetting<SiteTextStore>(SITE_CONTENT_KEYS.text),
    getSetting<SiteLink[]>(SITE_CONTENT_KEYS.links),
  ]);
  return {
    images: images ?? {},
    text: text ?? {},
    links: Array.isArray(links) && links.length > 0 ? links : null,
  };
}

/** GET /api/admin/site-content: overrides, slot metadata and defaults for the Content page */
export async function GET() {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const current = await readAll();

    const defaultsText = Object.fromEntries(
      LOCALES.map((l) => [l, flattenEditable(getDictionary(l) as unknown as Record<string, unknown>)])
    ) as Record<(typeof LOCALES)[number], TextOverrides>;

    return NextResponse.json({
      ...current,
      slots: IMAGE_SLOTS,
      defaults: { links: DEFAULT_LINKS, text: defaultsText },
    });
  } catch (error) {
    return serverError('Failed to load site content', error);
  }
}

/** PUT /api/admin/site-content: partial { images?, text?, links? } */
export async function PUT(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const body = await req.json().catch(() => null);
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);
    const { images, text, links } = parsed.data;

    await dbConnect();
    const current = await readAll();

    if (images) {
      const next: ImageOverrides = { ...current.images };
      for (const [key, value] of Object.entries(images) as [ImageSlotKey, z.infer<typeof imageOverride> | null][]) {
        if (value === null) delete next[key];
        else next[key] = value;
      }
      await setSetting(SITE_CONTENT_KEYS.images, next);
    }

    if (text) {
      const next: SiteTextStore = { ...current.text };
      for (const [locale, fields] of Object.entries(text) as [(typeof LOCALES)[number], Record<string, string | null>][]) {
        const merged: TextOverrides = { ...(next[locale] ?? {}) };
        for (const [path, value] of Object.entries(fields)) {
          if (value === null || value.trim() === '') delete merged[path];
          else merged[path] = value;
        }
        next[locale] = merged;
      }
      await setSetting(SITE_CONTENT_KEYS.text, next);
    }

    if (links !== undefined) {
      await setSetting(SITE_CONTENT_KEYS.links, links ?? []);
    }

    // Every public page reads these: refresh the whole site's cached HTML
    revalidatePath('/', 'layout');

    const saved = await readAll();
    return NextResponse.json({ success: true, ...saved });
  } catch (error) {
    return serverError('Failed to save site content', error);
  }
}
