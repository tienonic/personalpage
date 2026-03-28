(function(){
  var canvas = document.getElementById('tree');
  var ctx = canvas.getContext('2d');
  var w=160, h=200, pad=8;

  var xRules = [
    "F-[[X]+X]+F[+FX]-X",
    "F+[[X]-X]-F[-FX]+X",
    "F[-X]F[+X]+X",
    "F[+X]F[-X]-X",
    "FF-[-X+X]+[+X-X]",
    "F[+X][-X]FX"
  ];

  function generate() {
    var str, segCount;
    do {
      str = "X";
      var iters = 6 + Math.floor(Math.random() * 2);
      for (var i = 0; i < iters; i++) {
        var next = "";
        for (var j = 0; j < str.length; j++) {
          var ch = str[j];
          if (ch === "X") next += xRules[Math.floor(Math.random() * xRules.length)];
          else if (ch === "F") next += "FF";
          else next += ch;
        }
        str = next;
      }
      segCount = 0;
      for (var i = 0; i < str.length; i++) if (str[i] === "F") segCount++;
    } while (segCount < 300 || segCount > 4000);

    var tilt = (Math.random() - 0.5) * 6 * Math.PI / 180;
    var segs = [], stack = [], x = 0, y = 0, a = -Math.PI/2 + tilt, d = 0;
    var baseAngle = 22 + Math.random() * 8;
    var da = baseAngle * Math.PI / 180;
    var stepLen = 1.6 + Math.random() * 0.8;
    var jitter = 0.3 + Math.random() * 0.3;
    var thickDecay = 0.5 + Math.random() * 0.2;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === "F") {
        var len = stepLen * (0.9 + Math.random() * 0.2);
        var nx = x + len * Math.cos(a), ny = y + len * Math.sin(a);
        segs.push({x1:x,y1:y,x2:nx,y2:ny,d:d});
        x = nx; y = ny;
      } else if (ch === "+") a += da * (1 + (Math.random()-0.5)*jitter);
      else if (ch === "-") a -= da * (1 + (Math.random()-0.5)*jitter);
      else if (ch === "[") { stack.push({x:x,y:y,a:a,d:d}); d++; }
      else if (ch === "]") { var s = stack.pop(); x=s.x; y=s.y; a=s.a; d=s.d; }
    }

    var minX=0,maxX=0,minY=0,maxY=0,maxD=0;
    for (var i=0;i<segs.length;i++){
      var s=segs[i];
      if(s.x1<minX)minX=s.x1;if(s.x2<minX)minX=s.x2;
      if(s.x1>maxX)maxX=s.x1;if(s.x2>maxX)maxX=s.x2;
      if(s.y1<minY)minY=s.y1;if(s.y2<minY)minY=s.y2;
      if(s.y1>maxY)maxY=s.y1;if(s.y2>maxY)maxY=s.y2;
      if(s.d>maxD)maxD=s.d;
    }

    var tW=maxX-minX||1, tH=maxY-minY||1;
    var sc=Math.min((w-pad*2)/tW,(h-pad*2)/tH);
    var ox=(w-tW*sc)/2-minX*sc;
    var oy=(h-tH*sc)/2-minY*sc;

    var byDepth={};
    for(var i=0;i<segs.length;i++){
      var s=segs[i];
      if(!byDepth[s.d])byDepth[s.d]=[];
      byDepth[s.d].push(s);
    }
    var depths=Object.keys(byDepth).map(Number).sort(function(a,b){return b-a;});

    var chains={};
    for(var di=0;di<depths.length;di++){
      var depth=depths[di];
      var segsAtD=byDepth[depth];
      var ch=[];
      var used=new Array(segsAtD.length);
      for(var si=0;si<segsAtD.length;si++){
        if(used[si])continue;
        var chain=[segsAtD[si]];used[si]=true;
        var searching=true;
        while(searching){
          searching=false;
          var last=chain[chain.length-1];
          for(var k=0;k<segsAtD.length;k++){
            if(used[k])continue;
            if(Math.abs(segsAtD[k].x1-last.x2)<0.01&&Math.abs(segsAtD[k].y1-last.y2)<0.01){
              chain.push(segsAtD[k]);used[k]=true;searching=true;break;
            }
          }
        }
        ch.push(chain);
      }
      chains[depth]=ch;
    }

    return {chains:chains, depths:depths, maxD:maxD, sc:sc, ox:ox, oy:oy, thickDecay:thickDecay};
  }

  function drawTree(tree, growth) {
    ctx.clearRect(0,0,w,h);
    ctx.lineCap="round";ctx.lineJoin="round";
    for(var di=0;di<tree.depths.length;di++){
      var depth=tree.depths[di];
      if(depth>=growth)continue;
      var g=Math.min(1,growth-depth);
      var dr=depth/(tree.maxD||1);
      var thick=Math.max(0.15,2.5*Math.pow(tree.thickDecay,depth));
      ctx.strokeStyle="rgba(25,22,18,"+(0.92-dr*0.25)*g+")";
      ctx.lineWidth=thick;
      var chs=tree.chains[depth];
      for(var ci=0;ci<chs.length;ci++){
        var chain=chs[ci];
        var pts=[];
        pts.push({x:chain[0].x1*tree.sc+tree.ox,y:chain[0].y1*tree.sc+tree.oy});
        for(var si=0;si<chain.length;si++){
          var s=chain[si];
          var ex=(s.x1+(s.x2-s.x1)*g)*tree.sc+tree.ox;
          var ey=(s.y1+(s.y2-s.y1)*g)*tree.sc+tree.oy;
          pts.push({x:ex,y:ey});
        }
        ctx.beginPath();
        ctx.moveTo(pts[0].x,pts[0].y);
        if(pts.length===2){
          ctx.lineTo(pts[1].x,pts[1].y);
        } else {
          for(var p=1;p<pts.length-1;p++){
            var mx=(pts[p].x+pts[p+1].x)/2;
            var my=(pts[p].y+pts[p+1].y)/2;
            ctx.quadraticCurveTo(pts[p].x,pts[p].y,mx,my);
          }
          ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);
        }
        ctx.stroke();
      }
    }
  }

  function animate(tree) {
    var t0=null;
    function tick(now){
      if(!t0)t0=now;
      var t=Math.min((now-t0)/5000,1);
      var ease=1-Math.pow(1-t,3);
      drawTree(tree, ease*(tree.maxD+1.5));
      if(t<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  ctx.setTransform(2, 0, 0, 2, 0, 0);
  var currentTree = generate();
  animate(currentTree);

  canvas.addEventListener('click', function() {
    currentTree = generate();
    animate(currentTree);
  });
})();
