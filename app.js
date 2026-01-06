// تبديل التبويبات
const tabButtons = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tab-panel");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    panels.forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// بيانات طبقات OSI
const osiData = {
  1: {
    title: "الطبقة الفيزيائية (Physical)",
    text: "مسؤولة عن الإشارات الكهربائية/الضوئية، الموصلات، السرعات (مثل 1GbE). أمثلة: كابلات Ethernet، الألياف، موائمات الشبكة."
  },
  2: {
    title: "طبقة ربط البيانات (Data Link)",
    text: "تتعامل مع التأطير والعناوين MAC والكشف عن الأخطاء داخل الشبكة المحلية. أمثلة: Ethernet، VLAN، STP."
  },
  3: {
    title: "طبقة الشبكة (Network)",
    text: "عنونة IP، التوجيه بين الشبكات، تحديد المسار. أمثلة: IPv4/IPv6، بروتوكولات التوجيه مثل OSPF وBGP."
  },
  4: {
    title: "طبقة النقل (Transport)",
    text: "الموثوقية والتحكم في التدفق والمنافذ. أمثلة: TCP (موثوق)، UDP (خفيف/أسرع)."
  },
  5: {
    title: "طبقة الجلسة (Session)",
    text: "إدارة الجلسات، إنشاءها وإنهاؤها وتزامنها بين الأطراف."
  },
  6: {
    title: "طبقة العرض (Presentation)",
    text: "التشفير، الضغط، وترجمة التنسيقات (مثل JSON، TLS)."
  },
  7: {
    title: "طبقة التطبيق (Application)",
    text: "واجهات وخدمات التطبيقات للمستخدم النهائي. أمثلة: HTTP، DNS، SMTP، FTP."
  }
};

document.querySelectorAll(".osi-layer").forEach(btn => {
  btn.addEventListener("click", () => {
    const layer = btn.dataset.layer;
    const box = document.getElementById("osi-details").querySelector(".details-content");
    box.innerHTML = `
      <h4>${osiData[layer].title}</h4>
      <p>${osiData[layer].text}</p>
    `;
  });
});

// حاسبة Subnet
const ipToInt = ip => ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
const intToIp = int => [24,16,8,0].map(shift => ((int >>> shift) & 255)).join(".");

const cidrToMaskInt = cidr => cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
const maskIntToStr = mask => intToIp(mask);

function calcSubnet(cidrInput) {
  // تحقق من الصيغة: A.B.C.D/E
  const m = cidrInput.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!m) throw new Error("صيغة غير صحيحة. استخدم شكل مثل 192.168.1.10/24");
  const ipStr = m[1];
  const cidr = parseInt(m[2], 10);

  const octs = ipStr.split(".").map(n => parseInt(n, 10));
  if (octs.some(o => o < 0 || o > 255)) throw new Error("قيمة IP غير صحيحة (يجب أن تكون 0..255)");
  if (cidr < 0 || cidr > 32) throw new Error("قيمة CIDR غير صحيحة (0..32)");

  const ipInt = ipToInt(ipStr);
  const maskInt = cidrToMaskInt(cidr);
  const network = ipInt & maskInt;
  const broadcast = network | (~maskInt >>> 0);

  const hostBits = 32 - cidr;
  const totalHosts = hostBits === 0 ? 1 : (2 ** hostBits);
  const usable = cidr === 31 ? 2 : cidr === 32 ? 1 : Math.max(totalHosts - 2, 0);

  const firstHost = (cidr >= 31) ? network : network + 1;
  const lastHost = (cidr >= 31) ? broadcast : broadcast - 1;

  return {
    ip: ipStr,
    cidr,
    mask: maskIntToStr(maskInt),
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    firstHost: intToIp(firstHost),
    lastHost: intToIp(lastHost),
    totalHosts,
    usableHosts: usable
  };
}

document.getElementById("calc-btn").addEventListener("click", () => {
  const input = document.getElementById("cidr-input").value;
  const out = document.getElementById("subnet-result");
  try {
    const r = calcSubnet(input);
    out.innerHTML = `
      <ul>
        <li><strong>IP المدخل:</strong> ${r.ip}/${r.cidr}</li>
        <li><strong>قناع الشبكة:</strong> ${r.mask}</li>
        <li><strong>عنوان الشبكة:</strong> ${r.network}</li>
        <li><strong>عنوان البث:</strong> ${r.broadcast}</li>
        <li><strong>أول مضيف:</strong> ${r.firstHost}</li>
        <li><strong>آخر مضيف:</strong> ${r.lastHost}</li>
        <li><strong>عدد العناوين الكلي:</strong> ${r.totalHosts}</li>
        <li><strong>عدد المضيفين القابل للتخصيص:</strong> ${r.usableHosts}</li>
      </ul>
    `;
  } catch (e) {
    out.innerHTML = `<p style="color:#fca5a5;"><strong>خطأ:</strong> ${e.message}</p>`;
  }
});

// محاكاة Ping (وهمية للأغراض التعليمية)
document.getElementById("ping-btn").addEventListener("click", async () => {
  const host = document.getElementById("ping-host").value.trim();
  const out = document.getElementById("ping-output");
  if (!host) { out.textContent = "الرجاء إدخال مضيف."; return; }

  out.textContent = `PING ${host}:\n`;
  // نص وهمي لعرض الفكرة
  for (let i = 1; i <= 4; i++) {
    const time = (Math.random() * 40 + 10).toFixed(1);
    const ttl = Math.floor(Math.random() * 50) + 50;
    await new Promise(res => setTimeout(res, 500));
    out.textContent += `Reply from ${host}: bytes=32 time=${time}ms TTL=${ttl}\n`;
  }
  out.textContent += `\nPing statistics for ${host}: Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`;
});

// محاكاة Traceroute (وهمية)
document.getElementById("trace-btn").addEventListener("click", async () => {
  const host = document.getElementById("trace-host").value.trim();
  const out = document.getElementById("trace-output");
  if (!host) { out.textContent = "الرجاء إدخال مضيف."; return; }

  out.textContent = `Tracing route to ${host} over a maximum of 10 hops:\n\n`;
  const hops = Math.floor(Math.random() * 5) + 5; // 5 - 9 قفزات
  for (let h = 1; h <= hops; h++) {
    await new Promise(res => setTimeout(res, 400));
    const ip = `10.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
    const t1 = (Math.random()*30+5).toFixed(1);
    const t2 = (Math.random()*30+5).toFixed(1);
    const t3 = (Math.random()*30+5).toFixed(1);
    out.textContent += `${h}\t${t1} ms\t${t2} ms\t${t3} ms\t${ip}\n`;
  }
  out.textContent += `\nTrace complete.`;
});

// اختبار سريع
document.getElementById("grade-btn").addEventListener("click", () => {
  const form = document.getElementById("quiz-form");
  const answers = {
    q1: "network",
    q2: "dns",
    q3: "62" // /26 => 2^(32-26)=64 عناوين، القابل للتخصيص = 64 - 2 = 62
  };
  let score = 0, total = 3;
  Object.keys(answers).forEach(q => {
    const chosen = form.querySelector(`input[name="${q}"]:checked`);
    if (chosen && chosen.value === answers[q]) score++;
  });
  const result = document.getElementById("quiz-result");
  const pct = Math.round((score/total)*100);
  result.innerHTML = `<p><strong>النتيجة:</strong> ${score} من ${total} (${pct}%). ${
    pct === 100 ? "إجابات ممتازة!" :
    pct >= 67 ? "جيد جدًا، تابع التعلم." :
    "لا بأس، راجع الأساسيات وجرب مرة أخرى."
  }</p>`;
});
