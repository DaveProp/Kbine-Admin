/* K-Bine CI : sons de l'app admin (tout est synthétisé, aucun fichier audio à héberger)
   KBSound.music(ctx, dest, t0, seconds)  -> musique entraînante (~118 bpm) qui dure "seconds" secondes
   KBSound.cash(ctx, dest, t)             -> son de caisse enregistreuse « cha-ching »
   KBSound.ding(ctx, dest, t)             -> petite note de validation                                 */
(function(){
  function mtof(m){ return 440 * Math.pow(2, (m - 69) / 12); }

  function tone(ctx, dest, t, f, d, type, vol){
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + d + 0.05);
  }

  var noiseBuf = null;
  function noise(ctx, dest, t, d, vol, type, freq, q){
    if(!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate){
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
      var a = noiseBuf.getChannelData(0);
      for(var i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
    }
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q || 0.8;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + d + 0.02);
  }

  function kick(ctx, dest, t){
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.25);
  }

  /* Musique : C - Am - F - G, arpèges joyeux + basse + batterie légère */
  var BARS = [
    { bass: 36, tones: [60, 64, 67, 72] },
    { bass: 33, tones: [57, 60, 64, 69] },
    { bass: 29, tones: [53, 57, 60, 65] },
    { bass: 31, tones: [55, 59, 62, 67] }
  ];
  var ARP_A = [0, 1, 2, 3, 2, 1, 2, 3];
  var ARP_B = [3, 2, 1, 2, 3, 2, 1, 0];
  var LEAD  = [[0, 2], [1, 1], [2, 2], [3, 1]]; /* note de mélodie par mesure : [index, octave] */

  function music(ctx, dest, t0, seconds){
    var master = ctx.createGain();
    master.gain.setValueAtTime(1, t0);
    master.gain.setValueAtTime(1, t0 + seconds - 3);
    master.gain.linearRampToValueAtTime(0.0001, t0 + seconds);
    master.connect(dest);
    var beat = 60 / 118, bar = beat * 4, eighth = beat / 2, n = Math.floor(seconds / bar);
    for(var b = 0; b < n; b++){
      var c = BARS[b % 4], t = t0 + b * bar, loop = Math.floor(b / 4);
      var arp = (loop % 2 === 0) ? ARP_A : ARP_B;
      for(var i = 0; i < 8; i++){
        var tt = t + i * eighth;
        tone(ctx, master, tt, mtof(c.tones[arp[i]]), eighth * 1.6, "triangle", 0.13);
        if(i % 2 === 1) noise(ctx, master, tt, 0.05, 0.05, "highpass", 7000, 0.7);
      }
      /* mélodie plus aiguë à partir de la 2e boucle */
      if(loop >= 1){
        var L = LEAD[b % 4];
        tone(ctx, master, t, mtof(c.tones[L[0]] + 12 * (L[1] - 1)), beat * 1.8, "square", 0.05);
        tone(ctx, master, t + beat * 2, mtof(c.tones[(L[0] + 2) % 4] + 12), beat * 1.8, "square", 0.05);
      }
      tone(ctx, master, t, mtof(c.bass), beat * 1.9, "sine", 0.32);
      tone(ctx, master, t + beat * 2, mtof(c.bass + 7), beat * 1.9, "sine", 0.26);
      kick(ctx, master, t); kick(ctx, master, t + beat * 2);
      noise(ctx, master, t + beat, 0.12, 0.18, "bandpass", 1800, 0.9);      /* caisse claire */
      noise(ctx, master, t + beat * 3, 0.12, 0.18, "bandpass", 1800, 0.9);
    }
    return master;
  }

  /* « Cha-ching » de caisse enregistreuse */
  function cash(ctx, dest, t){
    noise(ctx, dest, t, 0.07, 0.35, "bandpass", 2600, 1.2);        /* clac mécanique */
    tone(ctx, dest, t, 190, 0.07, "square", 0.12);
    noise(ctx, dest, t + 0.09, 0.05, 0.25, "highpass", 4000, 0.7);
    var bells = [[2093, 0.00], [2637, 0.05], [3136, 0.10]];         /* clochette */
    bells.forEach(function(b){
      tone(ctx, dest, t + 0.16 + b[1], b[0], 1.3, "sine", 0.22);
      tone(ctx, dest, t + 0.16 + b[1], b[0] * 2.76, 0.5, "sine", 0.05);
    });
    for(var i = 0; i < 9; i++){                                      /* pièces qui tombent */
      tone(ctx, dest, t + 0.45 + i * 0.065 + (i % 3) * 0.012, 3800 + (i * 397) % 2400, 0.22, "sine", 0.07);
    }
    return t + 1.8;
  }

  function ding(ctx, dest, t){
    tone(ctx, dest, t, 880, 0.35, "sine", 0.25);
    tone(ctx, dest, t + 0.14, 1175, 0.5, "sine", 0.25);
    tone(ctx, dest, t + 0.28, 1568, 0.7, "sine", 0.22);
    return t + 1;
  }

  window.KBSound = { music: music, cash: cash, ding: ding };
})();
