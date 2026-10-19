import { revalidatePath } from 'next/cache';

/** Refresh the cached blog list, every post page and the home blog teaser (all locales). */
export function revalidateBlog(): void {
  try {
    revalidatePath('/[lang]/blog', 'page');
    revalidatePath('/[lang]/blog/[slug]', 'page');
    revalidatePath('/[lang]', 'page');
  } catch (error) {
    console.error('[revalidate] blog paths failed:', error);
  }
}

/** Refresh the cached public bio page (/links). */
export function revalidateLinksPage(): void {
  try {
    revalidatePath('/links');
  } catch (error) {
    console.error('[revalidate] /links failed:', error);
  }
}
