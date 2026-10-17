import { PATHS, toJSON, useAdmin, type Bi, type UiData } from '../store';
import { BiField, Card, EditLangProvider, LangSwitch, PageHeader, SaveBar, useDraft } from '../ui';

// Arayüz yazıları sitede göründükleri yere göre gruplanır
const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Üst menü',
    items: [
      ['nav.work', 'İşler'],
      ['nav.services', 'Hizmetler'],
      ['nav.contact', 'İletişim'],
      ['cv', 'CV butonu'],
      ['menu', 'Mobil menü düğmesi (ekran okuyucu)'],
      ['mainMenu', 'Menü bölgesi adı (ekran okuyucu)'],
      ['language', 'Dil seçici adı (ekran okuyucu)'],
      ['skip', '“İçeriğe atla” bağlantısı'],
    ],
  },
  {
    title: 'İşler ve proje sayfası',
    items: [
      ['loading', 'Yükleme ekranı'],
      ['drag', 'Sürüklenen şerit: “Sürükle” yazısı'],
      ['openProject', '“Projeyi aç” bağlantısı'],
      ['client', '“Müşteri” etiketi'],
      ['role', '“Rol” etiketi'],
      ['services', '“Kapsam” etiketi'],
      ['credits', 'Künye butonu'],
      ['challenge', '“Problem” başlığı'],
      ['process', '“Süreç” başlığı'],
      ['result', '“Sonuç” başlığı'],
      ['next', '“Sıradaki proje” etiketi'],
      ['contactCta', 'Proje sonu: iletişim çağrısı başlığı'],
    ],
  },
  {
    title: 'Alt bilgi ve diğer',
    items: [
      ['available', 'Alt bilgi: durum cümlesi'],
      ['availableNote', 'Alt bilgi: durum açıklaması'],
      ['sitemap', 'Site haritası başlığı'],
      ['follow', 'Takip et başlığı'],
      ['backToTop', '“Başa dön”'],
      ['rights', 'Telif yazısı'],
      ['notFound', '404 sayfası metni'],
      ['home', '404: ana sayfa butonu'],
    ],
  },
];

const getAt = (data: UiData, key: string): Bi => {
  const [a, b] = key.split('.');
  const v = data[a] as Record<string, Bi> | Bi | undefined;
  return ((b ? (v as Record<string, Bi>)?.[b] : v) as Bi) ?? { tr: '', en: '' };
};
const setAt = (data: UiData, key: string, value: Bi): UiData => {
  const [a, b] = key.split('.');
  return b ? { ...data, [a]: { ...(data[a] as Record<string, Bi>), [b]: value } } : { ...data, [a]: value };
};

function TextsForm() {
  const { content, save, saving } = useAdmin();
  const { draft, setDraft, dirty, reset } = useDraft(content.ui);
  const onSave = () => save([{ path: PATHS.ui, text: toJSON(draft) }], 'Panel: arayüz metinleri güncellendi', { ui: draft });

  return (
    <div>
      <PageHeader title="Metinler" description="Menü, buton ve küçük etiket yazıları. Genellikle değiştirmeniz gerekmez." actions={<LangSwitch />} />
      <div className="grid gap-5 pb-28 lg:grid-cols-2">
        {GROUPS.map((g) => (
          <Card key={g.title} title={g.title}>
            {g.items.map(([key, label]) => (
              <BiField key={key} label={label} value={getAt(draft, key)} onChange={(v) => setDraft((d) => setAt(d, key, v))} />
            ))}
          </Card>
        ))}
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={onSave} onReset={reset} />
    </div>
  );
}

export default function Texts() {
  return (
    <EditLangProvider>
      <TextsForm />
    </EditLangProvider>
  );
}
