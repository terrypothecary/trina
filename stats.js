var Tpot = Tpot || {};

//==============================================================================
/*
Don't need a generic matrix library. Just something simple and specific
*/
//==============================================================================
Tpot.Stats = (function () {

    var Stats = function (period) {
        this._constructor(period);
    };

    Stats.prototype = {
        _constructor: function (period) {
            this.period = period;
            this.stats = [];
            this.logBuffer = [];
            this.maxLog = 5;
            this.logElement = document.getElementById('log');
        },

        log: function (msg) {
            if (this.logElement) {
                this.logBuffer.push(msg);
                while (this.logBuffer.length > this.maxLog) {
                    this.logBuffer.shift();
                }
                this.logElement.innerHTML = this.logBuffer.join('<br>');
            }
        },

        startFrame: function () {
            var stats = this.stats;
            var now = _now();
            this.currentFrame = {
                start: now,
                time: {},
                count: {}
            };

            while (stats.length > 0 && stats[0].start < (now - this.period)) {
                stats.shift();
            }

            stats.push(this.currentFrame);
            this.start('total');
        },

        finishFrame: function () {
            this.finish('total');
        },

        start: function (action) {
            this.currentFrame.time[action] = _now();
        },

        finish: function (action) {
            this.currentFrame.time[action] = _now() - this.currentFrame.time[action];
        },

        count: function (thing, number) {
            this.currentFrame.count[thing] = this.currentFrame.count[thing] || 0;
            this.currentFrame.count[thing] += number;
        },

        get: function () {
            var stats = this.stats;
            var times = [];
            var counts = [];
            var msg = [];

            if (stats.length > 1) {
                var frameTime = (stats[stats.length - 1].start - stats[0].start) / stats.length - 1;
                var fps = 1000 / frameTime;
                msg.push('<div><span class="name">frame:</span><span class="value">' + frameTime.toFixed(2) + '</span><span class="units">ms</span> <span>(' + fps.toFixed(2) + ' fps)</span></div>');

                Object.keys(this.currentFrame.time).forEach(function (action) {
                    var time = 0;
                    for (var i = 0, n = stats.length; i < n; i++) {
                        time += stats[i].time[action];
                    }
                    time =  time / stats.length;
                    times.push({
                        name: action,
                        time: time
                    });
                    msg.push('<div><span class="name">' + action + ':</span><span class="value">' + time.toFixed(2) + '</span><span class="units">ms</span></span><span class="percent">' + (100 * time / frameTime).toFixed(2) + '%</span></div>');
                }, this);

                Object.keys(this.currentFrame.count).forEach(function (thing) {
                    var count = 0;
                    for (var i = 0, n = stats.length; i < n; i++) {
                        count += stats[i].count[thing];
                    }
                    count = count / stats.length;
                    counts.push({
                        name: thing,
                        count: count
                    });
                    msg.push('<div><span class="name">' + thing + ':</span><span class="value">' + count + '</span></div>');
                }, this);
            }

            return msg.join('');
        }
    };

    return Stats;

    function _now() {
        return (new Date()).getTime();
    }

}());


