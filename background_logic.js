function draw_circle(ctx, color, pos_x, pos_y, radius) {
    ctx.beginPath();
    ctx.arc(pos_x, pos_y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function draw_rect(ctx, color, pos_x, pos_y, size_x, size_y) {
    ctx.beginPath();
    ctx.rect(pos_x, pos_y, size_x, size_y);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function draw_line(ctx, color, start_x, start_y, end_x, end_y){
    ctx.beginPath();      
    ctx.moveTo(start_x, start_y);    
    ctx.lineTo(end_x, end_y); 
    ctx.strokeStyle = color;
    ctx.stroke();     
    ctx.closePath();
}

const bg_canvas = document.getElementById("Back_canvas");

var X_pos = Math.random()*document.documentElement.scrollWidth;
var Y_pos = Math.random()*document.documentElement.scrollHeight;

const bg_ctx = bg_canvas.getContext("2d");
let bg_particle_array = [];
let rotator_array = [];
let global_time = 0;

let rotor_force = 1000;
let rotor_count = 10;
let particle_count = 1000;


let R = document.documentElement.scrollWidth/50.0;

function set_bg_params(rf, rc, pc){
    rotor_force = rf;
    rotor_count = rc;
    particle_count = pc;
    bg_canvas.width = document.documentElement.scrollWidth;
    bg_canvas.height = document.documentElement.scrollHeight;
    reload_bg();
}

class somePot{
    constructor(x_pos, y_pos) {
        this.pos = [x_pos, y_pos];
        this.color = [255 * Math.random(), 255 * Math.random(), 255 * Math.random()];
        this.F = 0.04;
        if (document.documentElement.scrollWidth < document.documentElement.scrollHeight)
            this.r = 300;
        else{
            this.r = 150;
        }
    }
    get_dens(xi, yi){
        let a = [xi - this.pos[0], yi - this.pos[1]];
        let x = a[0];
        let y = a[1];
        let k = 1.0;
        let r = this.r;
        let D = Math.pow(Math.min(Math.abs(x*x + (y*k - r)*(y*k - r) - r*r), Math.abs(x*x + (y*k + r)*(y*k + r) - r*r)), 0.5);
        //let D = Math.pow(Math.abs((x*x + (y*k - r)*(y*k - r) - r*r)* (x*x + (y*k + r)*(y*k + r) - r*r)), 0.5);
        return D/100.0;
    }
}
function sigmoid(x){
    return 1.0/(1.0 + Math.exp(-x*0.4));
}

function Dsigmoid(x){
    return 4*sigmoid(2.0*x)*sigmoid(-2.0*x);
}

function normalize(x, y){
    let l = Math.pow(x*x+y*y, 0.5);
    if (l > 0.0){
        return [x/l, y/l];
    }
    else{
        return [0, 0];
    }
}

function distance(a, b){
    x = a[0] - b[0];
    y = a[1] - b[1];
    return LEN(x, y);
}

function LEN(x, y){
    return Math.pow(x*x+y*y, 0.5);
}

class bg_particle{
    constructor (color, x_pos, y_pos){
        this.color = color;
        this.pos = [x_pos, y_pos];
        this.last_pos = [x_pos, y_pos];
        this.movement = [0, 0];
        this.p = [];
        this.alpha = 1.0 ;
        this.v = 1.0;
        this.mv = 1.0;
        this.ph = 0.0;
        this.dens = 0.0;
        this.densHave = false;
        this.t = Math.random();
        this.phase = Math.random()*2*Math.PI;
    }

    get_dens(A){
        if (!this.densHave){
            let S = 0;
            if (A){
                for (i = 0; i < rotator_array.length; i++) {
                    S += rotator_array[i].get_dens(this.pos[0], this.pos[1])/rotator_array.length;
                }
            }
            else{
                for (i = 0; i < rotator_array.length; i++) {
                    S += rotator_array[i].get_dens(this.last_pos[0], this.last_pos[1])/rotator_array.length;
                }
            }
            this.dens = Dsigmoid(S);
            //this.densHave = true;
        }
        return this.dens;
    }

    update_position() {
        if (this.t >= 1.5){
            this.t = Math.random();
            this.last_pos = [Math.random()*document.documentElement.scrollWidth, Math.random()*document.documentElement.scrollHeight]
            this.pos[0] = this.last_pos[0];
            this.pos[1] = this.last_pos[1];
        }
        this.v += this.mv;
        this.t += 0.01
        
        this.ph += Math.abs(this.v)*0.1;
        this.get_dens(true)
        let I = sigmoid(this.ph - 9.0)
        let red = I * this.dens;
        let black = 1.0 - I * (1 - red);
        let amp = ((this.dens*0.7 + 0.3) + 0.5*(1 - red)*this.phase)
        this.pos[0] = Math.sin(10.0*this.t*I - 0.01*this.v + this.phase)*R*amp + R*Math.sin((1 - red)*this.mv * this.t + 3*this.phase) + this.last_pos[0];
        this.pos[1] = Math.cos(10.0*this.t*I - 0.01*this.v + this.phase)*R*amp + R*Math.cos((1 - red)*this.mv * this.t+ 3*this.phase) + this.last_pos[1];
        this.color[0] = 255*(red + black);
        this.color[1] = 255*black;
        this.color[2] = 255*black;
        
        this.ph = Math.abs(Math.max(this.ph*0.999, 0.0));
        
        
        let color = "rgba(" + String(this.color[0]) + "," + String(this.color[1]) + "," + String(this.color[2])  + "," + String(this.alpha)+ ")";
        draw_circle(bg_ctx, color, this.pos[0], this.pos[1], R)
    }
}

function update_bg_logic(){
    for (let n = 0; n < bg_particle_array.length; n++) {
        bg_particle_array[n].update_position();
    }
}

function reload_bg() {
    bg_ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    bg_ctx.fillRect(0, 0, bg_canvas.width, bg_canvas.height);
    bg_particle_array = [];
    rotator_array = [];
    for (i = 0; i < 150; i++){
        bg_particle_array.push(new bg_particle([255, 100, 100], 
            Math.random()*document.documentElement.scrollWidth,
            Math.random()*document.documentElement.scrollHeight));
    }
    console.log(bg_particle_array.length)

    for (i = 0; i < bg_particle_array.length; i++){
        A = bg_particle_array[i].pos
        for (j = 0; j < bg_particle_array.length; j++){
            if (j != i){
                B = bg_particle_array[j].pos
                if (distance(A, B) < R*6.1){
                    bg_particle_array[i].p.push(bg_particle_array[j])
                }
            }
        }
    }

    rotator_array.push(new somePot(0.5* bg_canvas.width, 0.5* bg_canvas.height));

    for (i = 0; i < 0; i++) {
        update_bg_frame();
    }
}
bg_canvas.width = document.documentElement.scrollWidth;
bg_canvas.height = document.documentElement.scrollHeight;
reload_bg();
function update_bg_frame() {
    /*bg_ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
    bg_ctx.fillRect(0, 0, bg_canvas.width, bg_canvas.height);*/
    update_bg_logic();
}
setInterval(update_bg_frame, 0);