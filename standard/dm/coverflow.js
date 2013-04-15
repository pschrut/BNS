var cFlow = function() {

    var lf = 0;
    var cf = 0;
    var tm;

    function getElementsByClass(object, tag, className) {
        var obj = object.getElementsByTagName(tag);
        for (var i = 0, n = obj.length, ret = []; i < n; i++)
            if (obj[i].className == className) ret.push(obj[i]);
        if (ret.length == 1) ret = ret[0];
        return ret;
    }

    function addEvent(obj, e, f) {
        if (window.addEventListener) obj.addEventListener(e, f, false);
        else if (window.attachEvent) r = obj.attachEvent('on' + e, f);
    }

    function createReflexion(cont, img) {
        var flx = false;
        if (document.createElement("canvas").getContext) {
            flx = document.createElement("canvas");
            flx.width = img.width;
            flx.height = img.height;
            var context = flx.getContext("2d");
            context.translate(0, img.height);
            context.scale(1, -1);
            context.drawImage(img, 0, 0, img.width, img.height);
            flx.style.opacity = '0.35';
        } else {
            flx = document.createElement('img');
            flx.src = img.src;
            flx.style.filter = 'flipv progid:DXImageTransform.Microsoft.Alpha(' +
			                   'opacity=50, style=1, finishOpacity=0, startx=0, starty=0, finishx=0, finishy=' +
							   (img.height * .25) + ')';
        }
        flx.style.position = 'absolute';
        flx.style.left = '-4000px';
        cont.appendChild(flx);
        return flx;
    }

    function CoverFlow(parent, oCont, documents, horizon, size, zoom, border, start, interval) {
        this.parent = parent;
        this.prev = 0;
        this.diapos = [];
        this.scr = false;
        this.size = size;
        this.zoom = zoom;
        this.horizon = horizon;
        this.bdw = border;
        this.oCont = oCont;
        this.oc = $(oCont);
        this.scrollbar = getElementsByClass(this.oc, 'div', 'scrollbar');
        this.text = getElementsByClass(this.oc, 'div', 'text');
        this.title = getElementsByClass(this.text, 'div', 'title');
        this.bar = getElementsByClass(this.oc, 'img', 'bar');
        this.arL = getElementsByClass(this.oc, 'img', 'arrow-left');
        this.arR = getElementsByClass(this.oc, 'img', 'arrow-right');
        this.bw = 77; //this.bar.width;
        this.alw = 20; //this.arL.width - 5;
        this.arw = 20; //this.arR.width - 5;
        this.bar.parent = this.oc.parent = this;
        this.arL.parent = this.arR.parent = this;
        this.view = this.back = -1;
        this.time_start = start * 62.5 || 0;
        this.time_inter = interval * 62.5 || 0;
        this.time_out = this.time_start;
        this.time = 0;
        this.time_dir = 1;
        this.resize();
        this.oc.onselectstart = function() { return false; }
        var j = 0;

        var length = documents.length;
        for (var i = 0; i < length; i++) {
            if (documents[length - i - 1]) {
                this.diapos[j] = new Diapo(this, j, documents[length - i - 1]['@doc_name'], documents[length - i - 1]['@doc_id']);
                j++;
            }
        }

        this.NF = j;
        if (window.addEventListener)
            this.oc.addEventListener('DOMMouseScroll', function(e) {
                if (e.preventDefault) e.preventDefault();
                this.parent.scroll(-e.detail);
                return false;
            }, false);
        this.oc.onmousewheel = function() {
            this.parent.scroll(event.wheelDelta);
            return false;
        }
        this.bar.onmousedown = function(e) {
            if (!e) e = window.event;
            var scl = e.screenX - this.offsetLeft;
            var self = this.parent;
            this.parent.oc.onmousemove = function(e) {
                if (!e) e = window.event;
                self.bar.style.left = Math.round(Math.min((self.ws - self.arw - self.bw), Math.max(self.alw, e.screenX - scl))) + 'px';
                self.view = Math.round(((e.screenX - scl)) / (self.ws - self.alw - self.arw - self.bw) * (self.NF - 1));
                if (self.view != self.back) self.calc();
                return false;
            }
            this.parent.oc.onmouseup = function(e) {
                self.oc.onmousemove = null;
                return false;
            }
            return false;
        }
        this.arR.onclick = this.arR.ondblclick = function() {
            if (this.parent.view < this.parent.NF - 1)
                this.parent.calc(1);
        }
        this.arL.onclick = this.arL.ondblclick = function() {
            if (this.parent.view > 0)
                this.parent.calc(-1);
        }
    }

    CoverFlow.prototype = {

        calc: function(inc) {
            if (inc) {
                this.view += inc;
                this.time = 0;
                this.time_out = this.time_start;
            }
            var tw = 0;
            var lw = 0;
            var table = this.parent.listContainer.down('table');
            var ipp = (table) ? TableKit.tables[table.identify()].pages : 10;
            var obj = this.diapos[this.view];
            if (obj) {
                if (this.view > 0 && (this.NF > ipp)) {
                    var p = Math.floor(this.view / ipp) + 1;
                    TableKit.Sortable.goPage(null, table, p);
                }
                var tr = 'myDocuments_TrDocument';
                var cls = 'myDocuments_RowBold';
                if (this.prev && $(tr + this.prev)) {
                    if ($(tr + this.prev)) $(tr + this.prev).removeClassName(cls);
                }
                if ($(tr + obj.id)) $(tr + obj.id).addClassName(cls);
                this.prev = obj.id;
            }

            if (obj && obj.loaded) {
                var ob = this.diapos[this.back];
                if (ob && ob != obj) {
                    ob.img.className = 'diapo';
                    ob.z1 = 1;
                }
                this.title.innerHTML = obj.title;
                obj.img.className = 'diapo link';
                if (obj.r < 1) obj.w1 = Math.min(obj.iw, this.wh * .8, Math.round(this.ht * this.horizon / obj.r)) * obj.z1;
                else obj.w1 = Math.round(this.ht * this.horizon / obj.r) * obj.z1;
                var x0 = obj.x1 = (this.wh * .5) - (obj.w1 * .5);
                var x = x0 + obj.w1 + this.bdw;
                for (var i = this.view + 1, obj; obj = this.diapos[i]; i++) {
                    if (obj.loaded) {
                        obj.x1 = x;
                        obj.w1 = (this.ht / obj.r) * this.size;
                        x += obj.w1 + this.bdw;
                        tw += obj.w1 + this.bdw;
                    }
                }
                x = x0 - this.bdw;
                for (var i = this.view - 1, obj; obj = this.diapos[i]; i--) {
                    if (obj.loaded) {
                        obj.w1 = (this.ht / obj.r) * this.size;
                        obj.x1 = x - obj.w1;
                        x -= obj.w1 + this.bdw;
                        tw += obj.w1 + this.bdw;
                        lw += obj.w1 + this.bdw;
                    }
                }
                if (!this.scr && tw) {
                    var r = (this.ws - this.alw - this.arw - this.bw) / tw;
                    this.bar.style.left = Math.round(this.alw + lw * r) + 'px';
                }
                this.back = this.view;
            }
        },

        scroll: function(sc) {
            if (sc < 0) {
                if (this.view < this.NF - 1) this.calc(1);
            } else {
                if (this.view > 0) this.calc(-1);
            }
        },

        resize: function() {
            this.wh = this.oc.clientWidth;
            this.ht = this.oc.clientHeight;
            this.ws = this.scrollbar.offsetWidth;
            this.calc();
            this.run(true);
        },

        run: function(res) {
            if (this.parent && (this.parent.view != this.parent.viewValues.CoverFlow)) return;
            var i = this.NF;
            while (i--) this.diapos[i].move(res);
            if (this.time_out) {
                this.time++;
                if (this.time > this.time_out) {
                    if (this.view >= this.NF || this.view < 0) {
                        this.time_dir = -this.time_dir;
                    }
                    this.calc();
                    this.time = 0;
                    this.time_out = this.time_inter;
                }
            }
        }
    }

    Diapo = function(parent, N, title, id) {
        this.parent = parent;
        this.loaded = false;
        this.title = title;
        this.N = N;
        this.id = id;
        this.img = document.createElement('img');

        this.img.setAttribute('N', N);
        this.img.id = 'img' + id;
        this.img.parent = this;
        this.img.className = 'diapo';
        this.x0 = this.parent.oc.clientWidth;
        this.x1 = this.x0;
        this.w0 = 0;
        this.w1 = 0;
        this.z1 = 1;
        this.z2 = 0;
        this.img.parent = this;
        this.img.onclick = function() { this.parent.click(); }
        this.parent.oc.appendChild(this.img);
        this.img.onmouseover = function() { this.className = 'diapo link'; }
        this.img.onmouseout = function() { this.className = 'diapo'; }

        var xmlin = ""
        + "<EWS>"
            + "<SERVICE>DM_GET_THUMB</SERVICE>"
            + "<OBJECT TYPE=''/>"
            + "<DEL/><GCC/><LCC/>"
            + "<PARAM>"
                + "<I_V_CONTENT_ID>" + id + "</I_V_CONTENT_ID>"
            + "</PARAM>"
        + "</EWS>";

        var url = parent.parent.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';

        this.img.src = url + xmlin + '&nocach=' + Math.floor(Math.random() * 100001);
    }

    Diapo.prototype = {
        move: function(res) {
            var that = this.parent;
            if (this.loaded) {
                var sx = this.x1 - this.x0;
                var sw = this.w1 - this.w0;
                if (Math.abs(sx) > 2 || Math.abs(sw) > 2 || res) {
                    this.x0 += sx * .1;
                    this.w0 += sw * .1;
                    var h = this.w0 * this.r;
                    this.z2 = Math.ceil((that.ht * that.horizon + 1 - this.z2 - h) * .5);
                    if (this.x0 < that.wh && this.x0 + this.w0 > 0) {
                        this.visible = true;
                        var obj = this.img.style;
                        obj.left = Math.floor(this.x0) + 'px';
                        obj.bottom = Math.floor(that.ht * (1 - that.horizon) + this.z2) + 'px';
                        obj.width = Math.floor(this.w0) + 'px';
                        obj.height = Math.floor(h) + 'px';
                        if (this.flx) {
                            var obj = this.flx.style;
                            obj.left = Math.floor(this.x0) + 'px';
                            obj.top = Math.ceil(that.ht * that.horizon + 1 - this.z2) + 'px';
                            obj.width = Math.floor(this.w0) + 'px';
                            obj.height = Math.floor(h) + 'px';
                        }
                    } else {

                        if (this.visible) {
                            this.visible = false;
                            this.img.style.width = '0px';
                            if (this.flx) this.flx.style.width = '0px';
                        }
                    }
                }
            } else {
                if (this.img.complete && this.img.width) {
                    this.iw = this.img.width;
                    this.ih = this.img.height;
                    this.r = this.ih / this.iw;
                    this.loaded = true;
                    this.flx = createReflexion(that.oc, this.img);
                    if (that.view < 0) that.view = 0;
                    that.calc();
                }
            }
        },

        click: function() {
            this.parent.time = 0;
            this.parent.time_out = this.parent.time_start;
            if (this.parent.view == this.N) {
                this.z1 = this.z1 == 1 ? this.parent.zoom : 1;
                this.parent.calc();
            } else {
                this.parent.view = this.N;
                this.parent.calc();
            }
            return false;
        }
    }

    return {
        update: function(id) {
            var diap = $('img' + id).getAttribute('N');
            cf.diapos[diap].click();
        },

        stop: function() {
            clearInterval(tm);
            cFlow.initialized = false;
        },

        create: function(parent, div, documents, horizon, size, zoom, border, start, interval) {

            this.stop();

            var load = function() {
                var html = ''
                + ' <div class="text">'
		        + '     <div class="title">' + global.getLabel('DML_LOADING') + '...</div>'
		        + ' </div>'
		        + ' <div class="scrollbar">'
		        + '     <img class="track" src="standard/dm/sb.gif" alt="">'
		        + '     <img class="arrow-left" src="standard/dm/sl.gif" alt="">'
		        + '     <img class="arrow-right" src="standard/dm/sr.gif" alt="">'
		        + '     <img class="bar" src="standard/dm/sc.gif" alt="">'
		        + ' </div>';
                $(div).update(html);
                cf = new CoverFlow(parent, div, documents, horizon, size, zoom, border, start, interval);
                if (!cFlow.initialized) {
                    cFlow.initialized = true;

                    addEvent(window, 'resize', function() {
                        cf.resize();
                    });
                    addEvent($(div), 'mouseout', function(e) {
                        if (!e) e = window.event;
                        var tg = e.relatedTarget || e.toElement;
                        if (tg && tg.tagName == 'HTML') {
                            cf.oc.onmousemove = null;
                        }
                        return false;
                    });
                    
                    cf.calc();
                    tm = setInterval(function() {
                        cf.run();
                    }, 16);
                }
            }
            load();
        }
    }
} ();


