/*! puentes — exprime tus vacaciones con los festivos · DataFlow Elegance · MIT
 *  Festivos nacionales de España + los que añadas (autonómicos/locales).
 */
(function (g) {
  "use strict";
  var DAY = 86400000;
  function U(y, m, d) { return Date.UTC(y, m - 1, d); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function parse(s) { var p = String(s).split("-"); return U(+p[0], +p[1], +p[2]); }
  function pascua(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), gg = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - gg + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return U(y, mes, dia);
  }
  function festivos(y) {
    return [
      [U(y,1,1),"Año Nuevo"],[U(y,1,6),"Reyes"],[pascua(y)-2*DAY,"Viernes Santo"],[U(y,5,1),"Día del Trabajo"],
      [U(y,8,15),"Asunción"],[U(y,10,12),"Fiesta Nacional"],[U(y,11,1),"Todos los Santos"],
      [U(y,12,6),"Constitución"],[U(y,12,8),"Inmaculada"],[U(y,12,25),"Navidad"]
    ];
  }

  /** p = { ano, diasVacaciones, festivosExtra:["YYYY-MM-DD"], maxVentana } */
  function optimizar(p) {
    var y = parseInt(p.ano, 10), presupuesto = parseInt(p.diasVacaciones, 10) || 0, maxV = p.maxVentana || 16;
    var nombres = {};
    festivos(y).forEach(function (f) { nombres[f[0]] = f[1]; });
    (p.festivosExtra || []).filter(Boolean).forEach(function (s) { nombres[parse(s)] = nombres[parse(s)] || "Festivo local"; });
    var ini = U(y, 1, 1), n = Math.round((U(y + 1, 1, 1) - ini) / DAY);
    var libre = [];
    for (var i = 0; i < n; i++) { var t = ini + i * DAY, wd = new Date(t).getUTCDay(); libre.push(wd === 0 || wd === 6 || !!nombres[t]); }

    var cand = {};
    for (var s = 0; s < n; s++) {
      var w = 0;
      for (var e = s; e < Math.min(n, s + maxV); e++) {
        if (!libre[e]) w++;
        if (w < 1 || w > presupuesto || libre[s] || libre[e]) continue; // ventana empieza/termina en día laborable
        var a = s, b = e;
        while (a > 0 && libre[a - 1]) a--;
        while (b < n - 1 && libre[b + 1]) b++;
        var tieneFestivo = false;
        for (var k = a; k <= b; k++) if (nombres[ini + k * DAY]) { tieneFestivo = true; break; }
        if (!tieneFestivo) continue;
        var len = b - a + 1, key = a + "-" + b;
        var score = len / w;
        if (!cand[key] || cand[key].w > w) cand[key] = { a: a, b: b, w: w, len: len, score: score, ws: s, we: e };
      }
    }
    var lista = Object.keys(cand).map(function (k) { return cand[k]; })
      .filter(function (c) { return c.score >= 2; })
      .sort(function (x, z) { return z.score - x.score || z.len - x.len; });

    var elegidos = [], usados = 0, ocupado = {};
    lista.forEach(function (c) {
      if (usados + c.w > presupuesto) return;
      for (var k = c.a; k <= c.b; k++) if (ocupado[k]) return;
      for (k = c.a; k <= c.b; k++) ocupado[k] = 1;
      usados += c.w;
      var fest = [];
      for (k = c.a; k <= c.b; k++) if (nombres[ini + k * DAY]) fest.push(nombres[ini + k * DAY]);
      var pedir = [];
      for (k = c.ws; k <= c.we; k++) if (!libre[k]) pedir.push(iso(ini + k * DAY));
      elegidos.push({ desde: iso(ini + c.a * DAY), hasta: iso(ini + c.b * DAY), dias_libres: c.len,
        dias_vacaciones: c.w, pedir: pedir, festivos: fest, rendimiento: Math.round(c.score * 10) / 10 });
    });
    elegidos.sort(function (x, z) { return x.desde < z.desde ? -1 : 1; });
    var totalLibres = elegidos.reduce(function (acc, c) { return acc + c.dias_libres; }, 0);
    return { ano: y, vacaciones_usadas: usados, vacaciones_sobrantes: presupuesto - usados, dias_libres_total: totalLibres, puentes: elegidos };
  }

  g.Puentes = { optimizar: optimizar, festivos: festivos, pascua: pascua };
})(typeof window !== "undefined" ? window : globalThis);
