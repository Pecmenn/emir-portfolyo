import { useEffect } from 'react';

// Sayfa başlığı ve açıklaması: parametre verilmezse index.html'deki varsayılan değerler geri yüklenir.
// Her sayfa kendi canonical adresini taşır. (Sosyal medya botları JavaScript çalıştırmadığı için paylaşım
// önizlemesi proje sayfalarında da ana sayfanın etiketlerini gösterir; bkz. rapor.)
function upsert(tag: 'meta' | 'link', keyAttr: string, keyValue: string, valueAttr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(`${tag}[${keyAttr}="${keyValue}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(keyAttr, keyValue);
    document.head.appendChild(el);
  }
  el.setAttribute(valueAttr, value);
}

const base = {
  title: document.title,
  description: document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? '',
};

export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    const nextTitle = title ?? base.title;
    const nextDescription = description || base.description;
    document.title = nextTitle;
    upsert('meta', 'name', 'description', 'content', nextDescription);
    upsert('meta', 'property', 'og:title', 'content', nextTitle);
    upsert('meta', 'property', 'og:description', 'content', nextDescription);
    upsert('link', 'rel', 'canonical', 'href', `${window.location.origin}${window.location.pathname}`);
  }, [title, description]);
}
