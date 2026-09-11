/* CoffeeWorks makine seçici — eleme motoru ve arayüz */

const cevaplar = {};
const musteri = { firma: "", kisi: "", lokasyon: "", temsilci: "" };

/* ---------- Eleme ve puanlama ---------- */

function degerlendir(m, c) {
  const eleme = [];
  const uyari = [];
  const artı = [];
  let puan = 100;

  const ihtiyac = c.gunluk ? Number(c.gunluk) : null;

  if (ihtiyac) {
    if (m.kapasite < ihtiyac * 0.72) {
      eleme.push(`Kapasite yetersiz: ${m.kapasiteMetin}, ihtiyaç ≈${ihtiyac} fincan/gün`);
    } else if (m.kapasite > ihtiyac * 2.1) {
      puan -= 28;
      uyari.push(`Aşırı kapasite (${m.kapasiteMetin}). Yatırım geri dönüşü zayıflar.`);
    } else {
      puan -= Math.round(Math.abs(m.kapasite - ihtiyac) / ihtiyac * 22);
      if (m.kapasite >= ihtiyac && m.kapasite <= ihtiyac * 1.5) artı.push("Kapasite ihtiyaca oturuyor");
    }
  }

  if (c.pik === "yuksek" && m.pikSinifi < 3) {
    puan -= m.pikSinifi === 1 ? 34 : 16;
    uyari.push("Pik saat talebi yüksek: bu makinenin ısı toparlama süresi kuyruk oluşturabilir.");
  }
  if (c.pik === "yuksek" && m.pikSinifi === 3) artı.push("Pik saat performansı güçlü");

  if (c.sut === "taze" && !m.tazeSut) {
    eleme.push("Taze süt yok — sistem toz/granül süt üzerine kurulu");
  }
  if (c.sut === "yok") {
    puan += 4;
    artı.push("Sade kahve menüsünde süt donanımı tekliften tamamen çıkar");
  }

  if (c.toz === "evet") {
    if (m.toz === "yok") eleme.push("Toz/çikolata haznesi konfigüre edilemez");
    else if (m.toz === "versiyon") uyari.push(`Toz ürün için özel versiyon gerekir: ${m.tozHazne}`);
    else if (m.toz === "opsiyon") uyari.push(`Toz haznesi ek donanım kalemi: ${m.tozHazne}`);
    else artı.push("Toz ünitesi standart geliyor");
  }

  if (c.sogukKopuk === "evet") {
    if (m.sogukKopuk === "yok") eleme.push("Soğuk süt köpüğü yapamaz");
    else if (m.sogukKopuk === "opsiyon") {
      puan -= 12;
      uyari.push(m.sogukKopukNot || "Soğuk köpük yalnızca üst süt sistemiyle, ek maliyetle mümkün.");
    } else artı.push("Soğuk süt ve köpük standart");
  }

  if (c.cekirdek === "2" && m.ogutucuMax < 2) {
    eleme.push(`İki çekirdek desteklenmiyor (${m.ogutucuNot})`);
  }
  if (c.cekirdek === "2" && m.ogutucuMax >= 2) artı.push("Çift öğütücü mümkün");

  if (c.su === "yok") {
    if (m.tank === false) eleme.push("Su tankı ile çalışamaz, şebeke ve gider zorunlu");
    else if (m.tank === "opsiyon") uyari.push("Tanklı çalışma opsiyonel donanım olarak sipariş edilmeli");
    else artı.push("Tank ile susuz noktada çalışır");
  }

  if (c.elektrik === "zayif" && !m.zayifHatUygun) {
    eleme.push(`Mevcut hat yetersiz: ${m.kw[0]}–${m.kw[1]} kW çekiyor`);
  } else if (c.elektrik === "zayif" && m.zayifHatNot) {
    uyari.push(m.zayifHatNot + " — sipariş bu sürümle verilmeli.");
  }

  if (c.temizlik === "sirkulasyon") {
    if (m.sutTemizlik === "manuel" && c.sut === "taze") {
      puan -= 26;
      uyari.push("Değişken personelde manuel süt temizliği hijyen ve garanti riski üretir.");
    } else if (m.sutTemizlik === "yarim" && c.sut === "taze") {
      puan -= 12;
      uyari.push("Süt yolu haftalık manuel temizlik gerektirir; sorumlu kişi atanmalı.");
    } else if (m.sutTemizlik === "tam") {
      artı.push("Tam otomatik süt temizliği");
    }
  }

  if (c.telemetri === "gerekli") {
    if (m.telemetri === "standart") { puan += 8; artı.push("Çift yönlü telemetri standart, ek maliyet yok"); }
    else if (m.telemetri === "opsiyon") uyari.push(`Telemetri abonelik kalemi: ${m.telemetriMetin}`);
    else { puan -= 18; uyari.push("Telemetri desteği doğrulanmadı"); }
  }

  if (c.odeme === "ucretli" && m.odeme === "bilinmiyor") {
    puan -= 15;
    uyari.push("Ödeme sistemi entegrasyonu doğrulanmadı");
  }

  if (c.kullanim === "self") {
    if (m.id === "kalermk95l") artı.push("35 porsiyon posa haznesi self-servise uygun");
    if (m.sutTemizlik === "tam") artı.push("Self-serviste günlük müdahale minimum");
  }

  if (!m.dogrulandi) {
    puan -= 30;
    uyari.push("Teknik veri üretici dökümanıyla doğrulanmadı — yazılı spec alınmadan teklif verilmemeli.");
  }

  return { makine: m, puan: Math.max(0, Math.min(100, puan)), eleme, uyari, artı };
}

function sirala(c) {
  const hepsi = MAKINELER.map((m) => degerlendir(m, c));
  return {
    uygun: hepsi.filter((s) => s.eleme.length === 0).sort((a, b) => b.puan - a.puan),
    elenen: hepsi.filter((s) => s.eleme.length > 0)
  };
}

/* Tekliften çıkarılacak kalemler */
function tasarrufKalemleri(c) {
  const l = [];
  if (c.sut === "yok") l.push("Süt sistemi, süt soğutucu ve süt temizlik kimyasalı — sade kahve menüsünde hiçbiri gerekmiyor.");
  if (c.toz === "hayir") l.push("Toz/çikolata haznesi ve mikser — menüde toz ürün yok, donanım bedeli ve günlük temizlik yükü boşa gider.");
  if (c.sogukKopuk === "hayir" && c.sut === "taze") l.push("Soğuk köpük modülü (WMF Dynamic Milk / üst süt kademeleri) — sıcak süt sistemi yeterli.");
  if (c.cekirdek === "1") l.push("İkinci öğütücü ve ikinci çekirdek haznesi — kafeinsiz ihtiyacı manuel toz kahve girişiyle karşılanır.");
  if (c.odeme === "ucretsiz") l.push("Ödeme modülü ve jeton/kart donanımı — ücretsiz ikram noktası.");
  if (c.telemetri === "gereksiz") l.push("Telemetri aboneliği — raporlama talebi yok.");
  if (c.kullanim === "personel") l.push("Kilitli hazne ve ekran kilidi kiti — personel kullanımında gereksiz.");
  if (c.su === "var") l.push("Büyük su tankı opsiyonu ve damacana pompası — şebeke bağlantısı mevcut.");
  if (!l.length) l.push("Bu ihtiyaç profilinde elenecek donanım yok; tüm kalemler menü veya operasyon gereği.");
  return l;
}


/* ---------- İletişim ---------- */

function telLink(n) {
  const s = n.replace(/\D/g, "");
  return "tel:+9" + s;
}

function iletisimParcalari() {
  const p = [];
  ILETISIM.telefonlar.forEach((t) => p.push(`<a href="${telLink(t)}">${t}</a>`));
  if (ILETISIM.eposta) p.push(`<a href="mailto:${ILETISIM.eposta}">${ILETISIM.eposta}</a>`);
  if (ILETISIM.web) {
    const adres = ILETISIM.web.startsWith("http") ? ILETISIM.web : "https://" + ILETISIM.web;
    p.push(`<a href="${adres}" target="_blank" rel="noopener">${ILETISIM.web}</a>`);
  }
  if (ILETISIM.adres) p.push(ILETISIM.adres);
  return p;
}

function iletisimMetni() {
  const p = [...ILETISIM.telefonlar];
  if (ILETISIM.eposta) p.push(ILETISIM.eposta);
  if (ILETISIM.web) p.push(ILETISIM.web);
  if (ILETISIM.adres) p.push(ILETISIM.adres);
  return p.join(" | ");
}

function iletisimiKur() {
  document.querySelectorAll(".iletisimSatir").forEach((el) => {
    el.innerHTML = iletisimParcalari().join('<span class="ayirac">·</span>');
  });
  const alt = document.getElementById("altIletisim");
  if (alt) {
    alt.innerHTML = `<strong>${ILETISIM.sirket}</strong> — ${ILETISIM.slogan}
      <span class="altSatir">${iletisimParcalari().join('<span class="ayirac">·</span>')}</span>
      <span class="altSatir soluk">${ILETISIM.bolgeler} · ${ILETISIM.destek}</span>`;
  }
}

/* ---------- Arayüz ---------- */

const $ = (s) => document.querySelector(s);

function formuKur() {
  const kap = $("#sorular");
  let aktifBlok = "";
  SORULAR.forEach((s) => {
    if (s.blok !== aktifBlok) {
      aktifBlok = s.blok;
      const h = document.createElement("h3");
      h.className = "blok";
      h.textContent = s.blok;
      kap.appendChild(h);
    }
    const alan = document.createElement("fieldset");
    alan.className = "soru";
    alan.innerHTML = `<legend>${s.soru}</legend><p class="yardim">${s.yardim}</p>`;
    const grup = document.createElement("div");
    grup.className = "secenekler";
    s.secenekler.forEach((o) => {
      const id = `${s.id}-${o.deger}`;
      const l = document.createElement("label");
      l.className = "secenek";
      l.innerHTML = `<input type="radio" name="${s.id}" id="${id}" value="${o.deger}"><span>${o.etiket}</span>`;
      grup.appendChild(l);
    });
    alan.appendChild(grup);
    kap.appendChild(alan);
  });

  kap.addEventListener("change", (e) => {
    if (e.target.name) {
      cevaplar[e.target.name] = e.target.value;
      cizelgeyiGuncelle();
    }
  });

  ["firma", "kisi", "lokasyon", "temsilci"].forEach((k) => {
    $("#" + k).addEventListener("input", (e) => { musteri[k] = e.target.value; });
  });
}

function cizelgeyiKur() {
  const kap = $("#cizelge");
  kap.innerHTML = MAKINELER.map(
    (m) => `<li data-id="${m.id}"><span class="ad">${m.marka} ${m.model}</span>
      <span class="durum">—</span><span class="gerekce"></span></li>`
  ).join("");
}

function cizelgeyiGuncelle() {
  const cevaplanan = Object.keys(cevaplar).length;
  $("#ilerleme").textContent = `${cevaplanan}/${SORULAR.length} soru`;
  $("#ilerlemeCubuk").style.width = (cevaplanan / SORULAR.length) * 100 + "%";

  const { uygun, elenen } = sirala(cevaplar);
  const puanlar = {};
  uygun.forEach((s) => (puanlar[s.makine.id] = s));
  const elenenler = {};
  elenen.forEach((s) => (elenenler[s.makine.id] = s));

  MAKINELER.forEach((m) => {
    const li = $(`#cizelge li[data-id="${m.id}"]`);
    li.classList.remove("elendi", "lider");
    const durum = li.querySelector(".durum");
    const gerekce = li.querySelector(".gerekce");
    if (elenenler[m.id]) {
      li.classList.add("elendi");
      durum.textContent = "elendi";
      gerekce.textContent = elenenler[m.id].eleme[0];
    } else if (cevaplanan === 0) {
      durum.textContent = "—";
      gerekce.textContent = "";
    } else {
      durum.textContent = puanlar[m.id].puan + " puan";
      gerekce.textContent = "";
    }
  });
  if (cevaplanan > 0 && uygun.length) {
    $(`#cizelge li[data-id="${uygun[0].makine.id}"]`).classList.add("lider");
  }

  $("#raporBtn").disabled = cevaplanan < SORULAR.length;
  $("#raporBtn").textContent = cevaplanan < SORULAR.length
    ? `Raporu oluştur (${SORULAR.length - cevaplanan} soru kaldı)`
    : "Raporu oluştur";
}

function ozet(c) {
  const bul = (id, d) => {
    const s = SORULAR.find((x) => x.id === id);
    const o = s.secenekler.find((x) => x.deger === d);
    return o ? o.etiket : "—";
  };
  return SORULAR.map((s) => `<div class="ozetSatir"><dt>${s.soru}</dt><dd>${bul(s.id, c[s.id])}</dd></div>`).join("");
}

function kartHtml(s, rol) {
  const m = s.makine;
  return `<article class="oneri ${rol}">
    <header>
      <p class="rol">${rol === "ana" ? "Önerilen konfigürasyon" : "Alternatif"}</p>
      <h3>${m.marka} ${m.model}</h3>
      <p class="uyum">İhtiyaç uyumu ${s.puan}/100 · ${m.kapasiteMetin}</p>
    </header>
    <p class="neden">${m.guclu}</p>
    <dl class="kunye">
      <div><dt>Saatlik çıkış</dt><dd>${m.saatlik}</dd></div>
      <div><dt>Güç</dt><dd>${m.kw[0]}–${m.kw[1]} kW</dd></div>
      <div><dt>Isıtma</dt><dd>${m.isitma}</dd></div>
      <div><dt>Öğütücü</dt><dd>${m.ogutucuNot}</dd></div>
      <div><dt>Çekirdek haznesi</dt><dd>${m.cekirdekHazne}</dd></div>
      <div><dt>Toz haznesi</dt><dd>${m.tozHazne}</dd></div>
      <div><dt>Süt sistemi</dt><dd>${m.sutSistemi}</dd></div>
      <div><dt>Süt temizliği</dt><dd>${m.sutTemizlikMetin}</dd></div>
      <div><dt>Su</dt><dd>${m.su}</dd></div>
      <div><dt>Ekran</dt><dd>${m.ekran}</dd></div>
      <div><dt>Telemetri</dt><dd>${m.telemetriMetin}</dd></div>
      <div><dt>Ölçü</dt><dd>${m.boyut}</dd></div>
    </dl>
    ${s.artı.length ? `<ul class="artilar">${s.artı.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
    ${s.uyari.length ? `<ul class="uyarilar">${s.uyari.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
    <p class="dikkat">${m.dikkat}</p>
  </article>`;
}

function raporuOlustur() {
  const c = cevaplar;
  const { uygun, elenen } = sirala(c);
  const bugun = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  const kontrol = KONTROL_LISTESI.filter((k) => k.kosul(c)).map((k) => `<li>${k.metin}</li>`).join("");

  $("#rapor").innerHTML = `
    <header class="raporBaslik">
      <div>
        <h2>İhtiyaç analizi raporu</h2>
        <p class="meta">${musteri.firma || "Firma adı girilmedi"}${musteri.lokasyon ? " · " + musteri.lokasyon : ""}</p>
      </div>
      <dl class="raporMeta">
        <div><dt>Görüşülen kişi</dt><dd>${musteri.kisi || "—"}</dd></div>
        <div><dt>Temsilci</dt><dd>${musteri.temsilci || "—"}</dd></div>
        <div><dt>Tarih</dt><dd>${bugun}</dd></div>
      </dl>
    </header>

    <section class="raporIletisim">
      <p class="raporMarka">${ILETISIM.sirket}<span>${ILETISIM.slogan}</span></p>
      <p class="iletisimSatir"></p>
    </section>

    <section class="bolum">
      <h3>Alınan yanıtlar</h3>
      <dl class="ozet">${ozet(c)}</dl>
    </section>

    <section class="bolum">
      <h3>Model önerileri</h3>
      ${uygun.length
        ? uygun.slice(0, 3).map((s, i) => kartHtml(s, i === 0 ? "ana" : "alt")).join("")
        : `<p class="bos">Bu kısıtların tamamını karşılayan model yok. En sık nedeni şebeke suyu olmayan noktada soğuk köpük veya 200+ fincan talebidir. Kısıtlardan birini müşteriyle yeniden değerlendirin (tesisat çekilmesi, sıcak süt sistemiyle yetinilmesi veya iki küçük makine ile bölünmüş servis).</p>`}
    </section>

    <section class="bolum">
      <h3>Tekliften çıkarılacak kalemler</h3>
      <ul class="tasarruf">${tasarrufKalemleri(c).map((x) => `<li>${x}</li>`).join("")}</ul>
    </section>

    <section class="bolum">
      <h3>Teklife eklenecek kalemler</h3>
      <ul class="kontrol">${kontrol}</ul>
    </section>

    <section class="bolum">
      <h3>Elenen modeller</h3>
      <ul class="elenenListe">
        ${elenen.map((s) => `<li><strong>${s.makine.marka} ${s.makine.model}</strong> ${s.eleme.join(" · ")}</li>`).join("")}
      </ul>
    </section>

    <p class="kaynak">Teknik veriler üretici dökümanları ve yetkili distribütör spec sayfalarından derlenmiştir (Eylül 2026). Opsiyon ve fiyat kalemleri teklif öncesi distribütörle teyit edilir.</p>
  `;
  iletisimiKur();
  $("#raporSarmal").hidden = false;
  $("#raporSarmal").scrollIntoView({ behavior: "smooth", block: "start" });
}

function metinRapor() {
  const c = cevaplar;
  const { uygun, elenen } = sirala(c);
  const satir = [];
  satir.push(`${ILETISIM.sirket.toLocaleUpperCase("tr")} — İHTİYAÇ ANALİZİ`);
  satir.push(iletisimMetni());
  satir.push(`Firma: ${musteri.firma || "-"} | Kişi: ${musteri.kisi || "-"} | Lokasyon: ${musteri.lokasyon || "-"}`);
  satir.push(`Temsilci: ${musteri.temsilci || "-"} | Tarih: ${new Date().toLocaleDateString("tr-TR")}`);
  satir.push("");
  satir.push("YANITLAR");
  SORULAR.forEach((s) => {
    const o = s.secenekler.find((x) => x.deger === c[s.id]);
    satir.push(`- ${s.soru} ${o ? o.etiket : "-"}`);
  });
  satir.push("");
  satir.push("ÖNERİLER");
  uygun.slice(0, 3).forEach((s, i) => {
    satir.push(`${i === 0 ? "Ana öneri" : "Alternatif"}: ${s.makine.marka} ${s.makine.model} (${s.puan}/100, ${s.makine.kapasiteMetin})`);
    s.uyari.forEach((u) => satir.push(`   ! ${u}`));
  });
  satir.push("");
  satir.push("TEKLİFTEN ÇIKARILACAK");
  tasarrufKalemleri(c).forEach((x) => satir.push("- " + x));
  satir.push("");
  satir.push("TEKLİFE EKLENECEK");
  KONTROL_LISTESI.filter((k) => k.kosul(c)).forEach((k) => satir.push("- " + k.metin));
  satir.push("");
  satir.push("ELENEN MODELLER");
  elenen.forEach((s) => satir.push(`- ${s.makine.marka} ${s.makine.model}: ${s.eleme.join("; ")}`));
  satir.push("");
  satir.push(`${ILETISIM.sirket} · ${iletisimMetni()}`);
  return satir.join("\n");
}

function kunyeleriKur() {
  $("#kunyeler").innerHTML = MAKINELER.map((m) => `
    <details class="kunyeKart${m.dogrulandi ? "" : " dogrulanmadi"}">
      <summary><span>${m.marka} ${m.model}</span><span class="kunyeKap">${m.kapasiteMetin}</span></summary>
      <p class="kunyeSegment">${m.segment}</p>
      <dl class="kunye">
        <div><dt>Saatlik çıkış</dt><dd>${m.saatlik}</dd></div>
        <div><dt>Güç</dt><dd>${m.kw[0]}–${m.kw[1]} kW</dd></div>
        <div><dt>Isıtma</dt><dd>${m.isitma}</dd></div>
        <div><dt>Öğütücü</dt><dd>${m.ogutucuNot}</dd></div>
        <div><dt>Çekirdek haznesi</dt><dd>${m.cekirdekHazne}</dd></div>
        <div><dt>Toz haznesi</dt><dd>${m.tozHazne}</dd></div>
        <div><dt>Süt sistemi</dt><dd>${m.sutSistemi}</dd></div>
        <div><dt>Süt temizliği</dt><dd>${m.sutTemizlikMetin}</dd></div>
        <div><dt>Su</dt><dd>${m.su}</dd></div>
        <div><dt>Ekran</dt><dd>${m.ekran}</dd></div>
        <div><dt>Telemetri</dt><dd>${m.telemetriMetin}</dd></div>
        <div><dt>Ölçü</dt><dd>${m.boyut}</dd></div>
      </dl>
      <p class="dikkat">${m.dikkat}</p>
    </details>`).join("");
}

function sifirla() {
  Object.keys(cevaplar).forEach((k) => delete cevaplar[k]);
  document.querySelectorAll('#sorular input[type="radio"]').forEach((r) => (r.checked = false));
  $("#raporSarmal").hidden = true;
  cizelgeyiGuncelle();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", () => {
  formuKur();
  cizelgeyiKur();
  iletisimiKur();
  kunyeleriKur();
  cizelgeyiGuncelle();

  $("#raporBtn").addEventListener("click", raporuOlustur);
  $("#sifirlaBtn").addEventListener("click", sifirla);
  $("#yazdirBtn").addEventListener("click", () => window.print());
  $("#kopyalaBtn").addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText(metinRapor());
      e.target.textContent = "Kopyalandı";
      setTimeout(() => (e.target.textContent = "Metin olarak kopyala"), 1800);
    } catch {
      e.target.textContent = "Kopyalanamadı — yazdırmayı kullanın";
    }
  });
});
