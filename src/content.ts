// Sitedeki tüm içerik src/content/ altındaki JSON dosyalarında durur ve /admin panelinden düzenlenir.
// Bu dosya yalnızca türleri tanımlar ve içeriği bileşenlere dağıtır.
// Her metin { tr, en } çiftidir; dil seçicisi ikisi arasında geçiş yapar.

import contactData from './content/contact.json';
import playData from './content/play.json';
import siteData from './content/site.json';
import uiData from './content/ui.json';

export type Lang = 'tr' | 'en';
export type Text = { tr: string; en: string };

// alt: ekran okuyucu için görsel açıklaması (isteğe bağlı); boşsa görsel dekoratif sayılır
export type GalleryBlock =
  // Yan yana iki eşit görsel
  | { type: 'pair'; image1: string; image2: string; alt?: Text }
  // Bir metin ve bir görsel yan yana; side görselin hangi tarafta olduğunu belirler
  | { type: 'text-image'; text: Text; image: string; side: 'left' | 'right'; alt?: Text }
  // Sayfa genişliğinde görsel (kendi oranında), altında isteğe bağlı büyük bir cümle
  | { type: 'full'; image: string; quote?: Text; alt?: Text }
  // Sessiz, döngüde, ekranda görününce oynayan video. full: tam genişlik; değilse ortada daha dar
  | { type: 'video'; video: string; full: boolean }
  // Bölüm başlığı ve açıklaması
  | { type: 'text'; title: Text; text: Text }
  // Numaralı bölüm açılışı (01, 02 ...); numara bloğun sırasından otomatik gelir. world verilirse bölüm ve
  // ardından gelen bloklar o dünyada geçer: sayfa rengi o dünyaya akar, portal halkası açılır (bkz. WorldTour)
  | { type: 'chapter'; title: Text; text: Text; world?: ChapterWorld }
  // Fare hareketine göre 3 boyutlu eğilen tek görsel (ör. saydam zeminli cihaz görseli)
  | { type: 'showcase'; image: string; alt?: Text }
  // Fareyle ya da parmakla yatayda sürüklenen görsel şeridi
  | { type: 'strip'; images: string[]; alt?: Text }
  // Bölüm ekranda sabit kalır; kaydırdıkça saydam zeminli parçalar (ör. kaykaylar, karakterler) tek tek uçarak
  // gelip yelpaze (fan) ya da ızgara (grid) biçiminde dizilir
  | { type: 'flock'; title: Text; text: Text; images: string[]; layout: 'fan' | 'grid'; alt?: Text }
  // Bölüm ekranda sabit kalır; kaydırdıkça taslak görselin üstünden son hâli açılır. İki görsel aynı boyutta olmalı
  | { type: 'compare'; before: string; after: string; beforeLabel: Text; afterLabel: Text; alt?: Text }
  // Bölüm ekranda sabit kalır; sayfa aşağı kaydıkça görseller yatayda akar (ör. uygulama ekranları)
  | { type: 'pan'; title: Text; text: Text; images: string[]; alt?: Text }
  // Akış şeması: bir otomasyonun adımları birbirine bağlı kutular olarak (ör. tablo → yapay zekâ → mailing)
  | { type: 'flow'; title: Text; text: Text; steps: Step[] }
  // Sayfada oynanan bir oyun bölümü; game hangi oyunun kodlanmış bölümünün gösterileceğini seçer
  | { type: 'game'; game: 'snack-pack'; title: Text; text: Text }
  // Bölüm ekranda sabit kalır; kaydırdıkça geniş açılış görselinde kamera from noktasından (yatay %) portala
  // (toX / toY, %) kayıp içine dalar, ardından duraklar portaldan kendi renkleriyle açılır (ör. oyunun dünyaları).
  // exit verilirse sonunda portal bu renge açılır (ör. ardından gelen ilk dünyanın rengi); duraklar boş olabilir
  | { type: 'journey'; title: Text; text: Text; image: string; from: number; toX: number; toY: number; stages: JourneyStop[]; exit?: string; alt?: Text };

// Yolculuk durağı: başlık, açıklama, görsel, arkadan süzülen saydam parça (isteğe bağlı) ve zemin rengi
export type JourneyStop = { title: Text; text: Text; image: string; accent: string; color: string };

// Dünyanın arka planında oynayan hafif ortam efekti
export type Ambient = 'none' | 'embers' | 'bubbles' | 'sand' | 'clouds';

// Bölümün geçtiği dünya: adı, sayfanın akacağı renk, o dünyanın kaykayı (kahraman kapıya bununla girer), ortam efekti,
// dünya kapısı (portal görseli; bölüm başında kahraman içine kayar), element simgesi (bölüm başında büyük filigran)
// ve sahne objeleri (dünya boyunca kenarlarda ve arkada farklı derinliklerde süzülen saydam objeler).
// image: kapı yoksa bölüm başında kart olarak gösterilen görsel (ör. oyunun o dünyadaki ekranı)
export type ChapterWorld = {
  name: Text;
  color: string;
  image: string;
  accent: string;
  ambient: Ambient;
  gate?: string;
  icon?: string;
  props?: string[];
};

export type CaseStudy = {
  challenge: Text;
  process: Text;
  result: Text;
  metrics: { value: string; label: Text }[];
};

export type Project = {
  order: number;
  slug: string;
  title: string;
  discipline: Text;
  year: string;
  cover: string;
  // İsteğe bağlı kapak videosu (yüklenen dosya /videos/... ya da doğrudan .mp4/.webm bağlantısı).
  // Varsa kapak görselinin yerine oynar; görsel, video yüklenene kadar ve geçiş animasyonunda kullanılır.
  coverVideo?: string;
  // Dar ekranda (telefon) kapağın yatayda hangi bölümü görünür: 0 sol kenar, 50 orta (varsayılan), 100 sağ kenar
  coverFocus?: number;
  summary: Text;
  client: string;
  role: Text;
  services: Text;
  intro: Text;
  // UI/UX ve pazarlama projelerinde vaka çalışması bölümü gösterilir; marka ve motion projelerinde boş bırakılır
  caseStudy?: CaseStudy;
  gallery: GalleryBlock[];
  // Künye ve galeri koyu zeminde gösterilir (koyu tonlu sunumlar için)
  dark?: boolean;
  // Pasif proje sitede hiçbir yerde gösterilmez (giriş, işler listesi, sonraki proje, proje sayfası); panelde kalır
  hidden?: boolean;
  // İsteğe bağlı zemin rengi (ör. #131814). Sunum görsellerinin zeminiyle aynı renk verilirse görseller
  // sayfayla kesintisiz bir yüzey oluşturur
  canvas?: string;
  // Dünyalı (yolculuk) sayfalarda kaykaya binen kahramanın yandan görünen tam boy görseli (saydam zeminli); her dünyanın
  // girişinde o dünyanın kaykayıyla kapıya kayar
  rider?: string;
  // Projenin ait olduğu alanlar (Design / Build / Automate); İşler sayfasındaki filtreler bundan oluşur
  areas?: Area[];
  // Varsa galerinin yerine kaydırmayla oynayan sahneler gösterilir; sceneFont sahnelerde kullanılan marka yazısı
  // (Google Fonts biçiminde, ör. "Sora:wght@400;600;800")
  scenes?: Scene[];
  sceneFont?: string;
};

export type Area = 'design' | 'build' | 'automate';

// Sahne motoru (bkz. src/components/Scenes.tsx). Değerler [x, y, dönüş, ölçek, opaklık]; x ve y çalışma alanı
// biriminde (masaüstünde 1600×900, telefonda 400×700). start/end sahne ilerlemesinde 0-1 aralığıdır; out varsa
// katman aynı sahnede ikinci bir hareketle çıkar. Eksik değerler bir sonraki duruşun değerini alır
export type SceneMotion = {
  from?: number[];
  to?: number[];
  start?: number;
  end?: number;
  out?: { to: number[]; start: number; end: number };
};

// Fotoğraftaki bir telefon ekranı: maske (parmaklar önde kalsın diye), perspektif matrisi ve sırayla gösterilecek
// ekran görselleri. swap: her geçişin sahne ilerlemesindeki yeri (görsel sayısından bir eksik)
export type SceneScreen = { mask: string; matrix: string; w: number; h: number; images: string[]; swap?: number[] };

export type SceneLayer = {
  // photo: ekranı yerleştirilmiş fotoğraf · screen: tek uygulama ekranı · text: başlık ve metin · para: kaydırdıkça
  // kelime kelime aydınlanan paragraf · scrim: okunurluk için karartma · glow: renkli ışık · swatch: renk örneği ·
  // svg: logo gibi vektör · word: marka yazısıyla tek kelime · type: yazı tipi örneği · toast: bildirim kartı ·
  // steps: sahnedeki adımların ilerleme çizgisi
  kind: 'photo' | 'screen' | 'text' | 'para' | 'scrim' | 'glow' | 'swatch' | 'svg' | 'word' | 'type' | 'toast' | 'steps';
  // [x, y, genişlik, yükseklik?] çalışma alanı biriminde; full verilirse katman bütün sahneyi kaplar
  box?: number[];
  full?: boolean;
  z?: number;
  motion?: SceneMotion;
  // Hareketin merkezi: fotoğrafta fotoğraf pikseli, diğerlerinde katmanın yüzdesi
  origin?: number[];
  // Metin, paragraf ve adım katmanları: [giriş, çıkış?] sahne ilerlemesinde
  at?: number[];
  src?: string;
  width?: number;
  height?: number;
  screens?: SceneScreen[];
  // Bütün sahneyi kaplayan fotoğrafta kırpmanın odağı [0-1, 0-1]
  focus?: number[];
  radius?: number;
  kicker?: Text;
  title?: Text;
  text?: Text;
  label?: Text;
  labels?: Text[];
  size?: number;
  textSize?: number;
  align?: 'left' | 'center';
  side?: 'left' | 'bottom' | 'top';
  color?: string;
  ink?: string;
  accent?: string;
  font?: string;
  weight?: number;
  name?: string;
  value?: string;
  svg?: string;
  // Telefonda değişen alanlar; hide verilirse katman telefonda gösterilmez
  m?: Partial<Omit<SceneLayer, 'm' | 'kind'>> & { hide?: boolean };
};

// length: sahnenin kaydırma uzunluğu (vh, telefonda mlength); sahne bu süre boyunca ekranda sabit kalır
export type Scene = { length: number; mlength?: number; bg?: string; layers: SceneLayer[] };

type Site = {
  name: string;
  monogram: string;
  role: Text;
  email: string;
  cv: string;
  formEndpoint: string;
  socials: { label: string; href: string }[];
};

export const site = siteData as Site;
// CV bağlantısı yalnızca içerikte bir yol tanımlıysa gösterilir (boşsa düğmeler gizlenir)
export const cvUrl = (site.cv ?? '').trim();
export const ui = uiData;
export const contact = contactData;

// Panelde boş bırakılan vaka çalışması alanları sayfada bölüm olarak görünmesin
function hasCaseStudy(cs: CaseStudy | undefined): cs is CaseStudy {
  return !!cs && !!(cs.challenge?.tr || cs.process?.tr || cs.result?.tr || cs.metrics?.length);
}

const projectFiles = import.meta.glob<Project>('./content/projects/*.json', { eager: true, import: 'default' });

// Sitede yalnızca aktif projeler kullanılır
export const projects: Project[] = Object.values(projectFiles)
  .filter((p) => !p.hidden)
  .map((p) => ({ ...p, caseStudy: hasCaseStudy(p.caseStudy) ? p.caseStudy : undefined, gallery: p.gallery ?? [] }))
  .sort((a, b) => a.order - b.order);

// Pasif projeler dahil tüm başlıklar: oyun alanındaki parçaların etiketinde kullanılır
export const projectTitles: Record<string, string> = Object.fromEntries(Object.values(projectFiles).map((p) => [p.slug, p.title]));

// Yeni ana sayfa prototipi (/yeni): oyun alanı, proje indeksi ve hizmetler
// h: parçanın geniş ekrandaki yüksekliği (px); dar ekranda oranla küçülür
export type Sticker = { src: string; slug: string; h: number };
export type Play = {
  hello: Text;
  statement: { tr: string[]; en: string[] };
  text: Text;
  ctaWork: Text;
  ctaContact: Text;
  hint: Text;
  hintTouch: Text;
  // Ana sayfadaki 3B kutunun köşesindeki açıklama (objelerin hangi oyunlardan geldiği)
  pitCaption?: Text;
  open: Text;
  workTitle: Text;
  all: Text;
  servicesTitle: Text;
  services: { title: Text; text: Text; example: string }[];
  exampleLabel: Text;
  stickers: Sticker[];
  // Yeni ana sayfa (Design. Build. Automate.). Çok satırlı başlıklarda satırlar "\n" ile ayrılır
  hero: { lines: string[]; accent: number; intro: Text; status: Text };
  ticker: Text[];
  areas: { title: Text; text: Text; items: AreaItem[] };
  work: { title: Text; text: Text; featured: string[]; all: Text };
  case: { title: Text; text: Text; soon: Text; steps: Step[] };
  about: { title: Text; text: Text; photo: string; tools: { label: Text; items: string[] }[] };
  process: { title: Text; text: Text; steps: Step[] };
};

// images: satırdaki küçük görseller; "flow" yazılırsa yerine çizilmiş bir akış şeması gösterilir
export type AreaItem = { key: Area; title: string; text: Text; tags: Text[]; images: string[] };
export type Step = { title: Text; text: Text };
export const play = playData as Play;
