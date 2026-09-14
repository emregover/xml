# e-Fatura XML Görüntüleyici

UBL-TR e-Fatura XML dosyalarını, XML içinde gömülü gelen XSLT şablonunu kullanarak tarayıcıda görüntüleyen Next.js uygulaması.

## Özellikler

- XML dosyası tamamen tarayıcıda işlenir; dosya sunucuya gönderilmez.
- XML içindeki Base64 gömülü `.xslt` / `.xsl` eki otomatik bulunur ve çözülür.
- Tarayıcının `XSLTProcessor` desteği kullanılarak orijinal fatura görünümü oluşturulur.
- Fatura numarası, tarih, profil, tip, para birimi, satıcı/alıcı ve ödenecek tutar özetlenir.
- Görsel çıktı HTML olarak indirilebilir veya yazdırma menüsü ile PDF kaydedilebilir.
- XSLT çıktısındaki script/iframe/object/embed ve olay çalıştırıcıları temizlenir; önizleme sandbox'lı iframe içinde açılır.

## Yerel çalıştırma

```bash
npm install
npm run dev
```

Ardından `http://localhost:3000` adresini açın.

## Production build

```bash
npm run build
npm start
```

## Vercel

Repo Vercel'e bağlandığında Next.js olarak otomatik algılanır. Ek environment variable gerekmez.

## Not

Bazı tarayıcılar XSLT desteğini sınırlayabilir. En iyi sonuç için güncel Chrome veya Edge kullanın.
