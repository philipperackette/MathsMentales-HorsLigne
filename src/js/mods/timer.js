import utils from "./utils.js";
// Timer
export default class timer {
    constructor(slideid, cartId){
        this.durations = []; 
        this.durationId = 0; // id of the currect duration timer
        this.startTime = 0; // start time of the timer
        this.endTime = 0; // end time of the timer
        this.timeLeft = 0; // remaining time until the end of the timer
        this.percent = 0; // width of the progressbar
        this.id = slideid; // slider's number
        this.cartId = cartId;
        this.answerShowTime = 0;
        this.answerShown = false;
        this.break = false; // break state
        this.timer = false; // interval
        this.ended = false; // indicates if all has ended
        this.timePassed = 0;
    }
    getTimeLeft(diapo){
        this.timeLeft = this.endTime - Date.now();
        this.percent = Math.max(Math.round(100 - this.timeLeft/10/this.durations[this.durationId]), 0);
        this.display();
        if(this.timeLeft <= 0){
            if (diapo.carts[this.cartId].progress !== 'thenanswer'){
                this.timePassed += this.durations[this.durationId];
                this.stop();
                diapo.nextSlide(this.id);
            } else {
                if(!this.answerShown){
                    diapo.showTheAnswer(this.id, false)
                    this.answerShown = true;
                }
                if (this.timeLeft <= -this.answerShowTime){
                    this.stop()
                    diapo.nextSlide(this.id)
                }
                this.percent = 100 - Math.max(Math.round(-this.timeLeft/this.answerShowTime*100), 0);
                this.display()
            }
        }
    }
    addDuration(value){
        this.durations.push(value);
    }
    start(id, diapo){
        this.stop(); // just in case;
        if(this.ended) return false;
        this.break = false;
        const btnPause = document.querySelectorAll("#slider"+this.id+" .slider-nav i")[1];
        if(diapo.onlineState==="no"){
            btnPause.className="sprite sprite-slider-pause";
            utils.removeClass(btnPause,"blink_me");
        }
        if(id>-1){
            this.timeLeft = this.durations[id]*1000;
            this.durationId = id;
            this.answerShown = false;
            this.answerShowTime = diapo.carts[this.cartId].showAnswerTime*1000;
        }
        this.startTime = Date.now();
        this.endTime = this.startTime + this.timeLeft;
        if(this.timer){
            clearInterval(this.timer);
            this.timer = false;
        }
        // si pas de durée, avancement manuel.
        if(this.durations[id]==0){
            const btnPauseTimer = document.querySelector("#btn-timer-pause"+this.id)
            if(btnPauseTimer !== null) btnPauseTimer.classList.add("hidden");
            return;
        } else {
            this.timer = setInterval(this.getTimeLeft.bind(this, diapo),50);
        }
    }
    pause(diapo){
        if(this.ended) return false;
        if(this.break){
            this.break = false;
            this.start(-1,diapo);
            return false;
        } else {
            this.break = true;
            this.stop();
            let btnPause = document.querySelectorAll("#slider"+this.id+" .slider-nav i")[1];
            btnPause.className="sprite sprite-slider-play";
            utils.addClass(btnPause,"blink_me");
        }
    }
    stop(){
        if(this.timer){
            clearInterval(this.timer);
            this.timer = false;
        }
    }
    end(diapo){
        this.stop();
        this.ended = true;
        diapo.messageEndSlide(this.id,this.durationId);
        setTimeout(diapo.endSliders,3000);// if all of the timers ended together
    }
    display(){
        document.querySelector("#slider"+this.id+" progress").value = this.percent;
    }
}