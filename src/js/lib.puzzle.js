import utils from "./mods/utils.js";
import common from './mods/common.js';
import cart from './mods/cart.js';
import MMmath from "./mods/math.js";
// import Figure from './mods/figure.js';
// import activity from "./mods/activity.js";

const MM={};
MM.version = utils.getVersion()

let textSize = '0.35'
const puzzles = ['pyr16', 'hexa24', 'los18', 'pier12']
const parameters = {distract:false};
const $info = document.getElementById('info')
const nbQuestionsOfActivities = [];// array contenant les nombres de questions par activité
let type = 'pyr16'
const figures = {
    pyr16: "<svg id='pyr16' width='1093.733' height='620' viewBox='0 0 289.383 250.708' xmlns='http://www.w3.org/2000/svg'><g fill='#fff' stroke='#1a1a1a' stroke-width='.706' stroke-linecap='round' stroke-linejoin='round'><path d='M144.692 125.354h-72.17l36.085-62.5zm36.084-62.501h-72.169l36.085-62.5zm-72.169 0h72.17l-36.085 62.5zm0 125.002h-72.17l36.085-62.501zm-36.085-62.501h72.17l-36.085 62.5z'/><path d='M216.861 125.354h-72.17l36.085-62.5z'/><path d='M180.776 187.855h-72.169l36.085-62.501zm72.17 0h-72.17l36.085-62.501z'/><path d='M144.692 125.354h72.17l-36.086 62.5zm-72.17 125.001H.352l36.085-62.5zM36.437 187.855h72.17l-36.085 62.5zm108.255 62.5h-72.17l36.085-62.5z'/><path d='M216.861 250.355h-72.17l36.085-62.5z'/><path d='M108.607 187.855h72.17l-36.085 62.5zm180.423 62.5h-72.169l36.085-62.5z'/><path d='M180.776 187.855h72.17l-36.085 62.5z'/></g><g><foreignObject x='6' y='229' width='60' height='20'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[11]}}</div></foreignObject><foreignObject x='151' y='-147' width='60' height='20' transform='rotate(120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[0]}}</div></foreignObject><foreignObject x='-247' y='-84' width='60' height='20' transform='rotate(-120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[12]}}</div></foreignObject></g><g transform='translate(72.3)'><foreignObject x='6' y='229' width='60' height='20'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[10]}}</div></foreignObject><foreignObject x='151' y='-147' width='60' height='20' transform='rotate(120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[13]}}</div></foreignObject><foreignObject x='-247' y='-84' width='60' height='20' transform='rotate(-120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[14]}}</div></foreignObject></g><g transform='translate(144.6)'><foreignObject x='6' y='229' width='60' height='20'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[9]}}</div></foreignObject><foreignObject x='151' y='-147' width='60' height='20' transform='rotate(120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[15]}}</div></foreignObject><foreignObject x='-247' y='-84' width='60' height='20' transform='rotate(-120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[16]}}</div></foreignObject></g><g transform='translate(216.9)'><foreignObject x='6' y='229' width='60' height='20'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[8]}}</div></foreignObject><foreignObject x='151' y='-147' width='60' height='20' transform='rotate(120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[17]}}</div></foreignObject><foreignObject x='-247' y='-84' width='60' height='20' transform='rotate(-120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[7]}}</div></foreignObject></g><g transform='translate(36.3 -62.3)'><foreignObject x='6' y='229' width='60' height='20'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[9]}}</div></foreignObject><foreignObject x='151' y='-147' width='60' height='20' transform='rotate(120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[1]}}</div></foreignObject><foreignObject x='-247' y='-84' width='60' height='20' transform='rotate(-120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[5]}}</div></foreignObject></g><g transform='translate(108.6 -62.3)'><foreignObject x='6' y='229' width='60' height='20'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[10]}}</div></foreignObject><foreignObject x='151' y='-147' width='60' height='20' transform='rotate(120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[6]}}</div></foreignObject><foreignObject x='-247' y='-84' width='60' height='20' transform='rotate(-120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[7]}}</div></foreignObject></g><g transform='translate(180.9 -62.3)'><foreignObject x='6' y='229' width='60' height='20'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[11]}}</div></foreignObject><foreignObject x='151' y='-147' width='60' height='20' transform='rotate(120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[8]}}</div></foreignObject><foreignObject x='-247' y='-84' width='60' height='20' transform='rotate(-120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[6]}}</div></foreignObject></g><g transform='translate(72.3 -124.6)'><foreignObject x='6' y='229' width='60' height='20'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[3]}}</div></foreignObject><foreignObject x='151' y='-147' width='60' height='20' transform='rotate(120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[2]}}</div></foreignObject><foreignObject x='-247' y='-84' width='60' height='20' transform='rotate(-120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[1]}}</div></foreignObject></g><g transform='translate(144.6 -124.6)'><foreignObject x='6' y='229' width='60' height='20'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[4]}}</div></foreignObject><foreignObject x='151' y='-147' width='60' height='20' transform='rotate(120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[2]}}</div></foreignObject><foreignObject x='-247' y='-84' width='60' height='20' transform='rotate(-120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[5]}}</div></foreignObject></g><g transform='translate(108.5 -187.8)'><foreignObject x='6' y='229' width='60' height='20'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[0]}}</div></foreignObject><foreignObject x='151' y='-147' width='60' height='20' transform='rotate(120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[3]}}</div></foreignObject><foreignObject x='-247' y='-84' width='60' height='20' transform='rotate(-120)'><div xmlns='http://www.w3.org/1999/xhtml'>{{dis[4]}}</div></foreignObject></g><g><foreignObject x='-102.5' y='-209' width='60' height='20' transform='scale(-1)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[9]}}</div></foreignObject><foreignObject x='-174.5' y='166.5' width='60' height='20' transform='rotate(-60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[13]}}</div></foreignObject><foreignObject x='187' y='41' width='60' height='20' transform='rotate(60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[12]}}</div></foreignObject></g><g transform='translate(72.3)'><foreignObject x='-102.5' y='-209' width='60' height='20' transform='scale(-1)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[10]}}</div></foreignObject><foreignObject x='-174.5' y='166.5' width='60' height='20' transform='rotate(-60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[15]}}</div></foreignObject><foreignObject x='187' y='41' width='60' height='20' transform='rotate(60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[14]}}</div></foreignObject></g><g transform='translate(144.6)'><foreignObject x='-102.5' y='-209' width='60' height='20' transform='scale(-1)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[11]}}</div></foreignObject><foreignObject x='-174.5' y='166.5' width='60' height='20' transform='rotate(-60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[17]}}</div></foreignObject><foreignObject x='187' y='41' width='60' height='20' transform='rotate(60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[16]}}</div></foreignObject></g><g transform='translate(36.2 -62.3)'><foreignObject x='-102.5' y='-209' width='60' height='20' transform='scale(-1)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[3]}}</div></foreignObject><foreignObject x='-174.5' y='166.5' width='60' height='20' transform='rotate(-60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[6]}}</div></foreignObject><foreignObject x='187' y='41' width='60' height='20' transform='rotate(60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[5]}}</div></foreignObject></g><g transform='translate(108.5 -62.3)'><foreignObject x='-102.5' y='-209' width='60' height='20' transform='scale(-1)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[4]}}</div></foreignObject><foreignObject x='-174.5' y='166.5' width='60' height='20' transform='rotate(-60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[8]}}</div></foreignObject><foreignObject x='187' y='41' width='60' height='20' transform='rotate(60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[7]}}</div></foreignObject></g><g transform='translate(72.4 -124.6)'><foreignObject x='-102.5' y='-209' width='60' height='20' transform='scale(-1)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[0]}}</div></foreignObject><foreignObject x='-174.5' y='166.5' width='60' height='20' transform='rotate(-60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{R[2]}}</div></foreignObject><foreignObject x='187' y='41' width='60' height='20' transform='rotate(60)'><div xmlns='http://www.w3.org/1999/xhtml'>{{Q[1]}}</div></foreignObject></g></svg>",
    hexa24: '<svg id="hexa24" width="1093.733" height="660" viewBox="0 0 289.383 250.708" xmlns="http://www.w3.org/2000/svg"><path d="M108.607 62.853h-72.17L72.522.353z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M72.522.353h72.17l-36.085 62.5zm108.254 62.5h-72.169l36.085-62.5zm72.17 0h-72.17l36.085-62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M144.692.353h72.17l-36.086 62.5zm-72.17 125.001H.352l36.085-62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M36.437 62.853h72.17l-36.085 62.501zm108.255 62.501h-72.17l36.085-62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M216.861 125.354h-72.17l36.085-62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M108.607 62.853h72.17l-36.085 62.501zm180.423 62.501h-72.169l36.085-62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M180.776 62.853h72.17l-36.085 62.501zM108.607 187.855h-72.17l36.085 62.5zm-36.085 62.5h72.17l-36.085-62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M180.776 187.855h-72.17l36.086 62.5zm72.17 0h-72.17l36.085 62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M144.692 250.355h72.17l-36.086-62.5zm-72.17-125.001H.352l36.085 62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M36.437 187.855h72.17l-36.085-62.501zm108.255-62.501h-72.17l36.085 62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M216.861 125.354h-72.17l36.085 62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M108.607 187.855h72.17l-36.085-62.501zm180.423-62.501h-72.169l36.085 62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M180.776 187.855h72.17l-36.085-62.501z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{R[6]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[11]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[0]}}</div></foreignObject><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[0]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[1]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[0]}}</div></foreignObject><g transform="translate(72.2)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{R[5]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[1]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[2]}}</div></foreignObject></g><g transform="translate(72.2)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[1]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[3]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[2]}}</div></foreignObject></g><g transform="translate(144.4)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[4]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[3]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[2]}}</div></foreignObject></g><g transform="translate(-36.1 62.53)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{R[16]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[10]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[7]}}</div></foreignObject></g><g transform="translate(-36.1 62.53)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[15]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[8]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[9]}}</div></foreignObject></g><g transform="translate(36.1 62.53)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{R[15]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[8]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[9]}}</div></foreignObject></g><g transform="translate(36.1 62.53)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[5]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[10]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[9]}}</div></foreignObject></g><g transform="translate(108.3 62.53)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{R[14]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[10]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[11]}}</div></foreignObject></g><g transform="translate(108.3 62.53)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[4]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[12]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[11]}}</div></foreignObject></g><g transform="translate(180.5 62.53)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[13]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[12]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[3]}}</div></foreignObject></g><g><g transform="translate(-72.2 125)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[16]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[17]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[9]}}</div></foreignObject></g><g transform="translate(0 125)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{R[25]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[17]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[18]}}</div></foreignObject></g></g><g><g transform="translate(0 125)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[15]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[19]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[18]}}</div></foreignObject></g><g transform="translate(72.2 125)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{R[24]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[19]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[20]}}</div></foreignObject></g></g><g><g transform="translate(72.2 125)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[14]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[21]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[20]}}</div></foreignObject></g><g transform="translate(144.4 125)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[23]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[21]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[22]}}</div></foreignObject></g></g><g transform="translate(144.4 125)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[13]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[4]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[22]}}</div></foreignObject></g><g><g transform="translate(-36.1 187.5)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[25]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[26]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[8]}}</div></foreignObject></g><g transform="translate(36.1 187.5)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[7]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[26]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[27]}}</div></foreignObject></g></g><g><g transform="translate(36.1 187.5)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[24]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[28]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[27]}}</div></foreignObject></g><g transform="translate(108.3 187.5)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[6]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[28]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[29]}}</div></foreignObject></g></g><g transform="translate(108.3 187.5)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[23]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[5]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[29]}}</div></foreignObject></g></svg>',
    los18: '<svg id="los18" width="820.965" height="880" viewBox="0 0 217.213 375.709" xmlns="http://www.w3.org/2000/svg"><path d="M144.693 62.853h-72.17l36.085-62.5zm-72.17 0h72.17l-36.085 62.5zm108.255 62.5h-72.17l36.085-62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M108.608 125.353h-72.17l36.085-62.5zm-72.17 0h72.17l-36.085 62.5zm180.423 62.5h-72.17l36.086-62.5zM72.522 312.855h72.17l-36.085 62.5zm36.085-62.5h-72.17l36.086 62.5zm72.17 0h-72.17l36.085 62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M72.522 187.855h72.17l-36.085-62.501zm108.255-62.501h-72.17l36.085 62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M144.692 187.854h-72.17l36.085 62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M36.438 250.355h72.17l-36.085-62.501zm180.423-62.501h-72.17l36.086 62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M108.607 250.355h72.17l-36.085-62.501zM.353 187.854h72.17l-36.085 62.5zm72.17 0H.353l36.085-62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(36.1)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div>{{R[0]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div>{{dis[11]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div>{{dis[0]}}</div></foreignObject></g><g transform="translate(.03 62.5)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div>{{R[4]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div>{{dis[10]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div>{{Q[1]}}</div></foreignObject></g><g transform="translate(.03 62.5)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div>{{Q[0]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div>{{Q[2]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div>{{R[1]}}</div></foreignObject></g><g transform="translate(72.23 62.5)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div>{{Q[3]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div>{{R[2]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div>{{dis[1]}}</div></foreignObject></g><g transform="translate(-36.07 125.03)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div>{{R[11]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div>{{dis[9]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div>{{R[5]}}</div></foreignObject></g><g transform="translate(-36.07 125.03)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div>{{Q[4]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div>{{R[6]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div>{{Q[5]}}</div></foreignObject></g><g transform="translate(36.13 125.03)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div>{{R[10]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div>{{Q[6]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div>{{Q[7]}}</div></foreignObject></g><g transform="translate(36.13 125.03)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div>{{R[3]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div>{{Q[8]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div>{{R[7]}}</div></foreignObject></g><g transform="translate(108.33 125.03)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div>{{Q[9]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div>{{R[8]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div>{{dis[2]}}</div></foreignObject></g><g transform="translate(-72.17 187.5)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div>{{Q[11]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div>{{R[12]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div>{{dis[8]}}</div></foreignObject></g><g transform="translate(.03 187.5)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div>{{R[17]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div>{{Q[12]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div>{{Q[13]}}</div></foreignObject></g><g transform="translate(.03 187.5)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div>{{Q[10]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div>{{Q[14]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div>{{R[13]}}</div></foreignObject></g><g transform="translate(72.23 187.5)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div>{{Q[16]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div>{{R[14]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div>{{R[15]}}</div></foreignObject></g><g transform="translate(72.23 187.5)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div>{{R[9]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div>{{dis[3]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div>{{Q[15]}}</div></foreignObject></g><g transform="translate(-36.07 250)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div>{{Q[17]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div>{{R[18]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div>{{dis[7]}}</div></foreignObject></g><g transform="translate(36.13 250)"><foreignObject x="42.5" y="41.5" width="60" height="20"><div>{{Q[20]}}</div></foreignObject><foreignObject x="-30" y="-85" width="60" height="20" transform="rotate(120)"><div>{{Q[18]}}</div></foreignObject><foreignObject x="-103" y="41" width="60" height="20" transform="rotate(-120)"><div>{{R[19]}}</div></foreignObject></g><g transform="translate(36.13 250)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div>{{R[16]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div>{{dis[4]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div>{{Q[19]}}</div></foreignObject></g><g transform="translate(0 312.5)"><foreignObject x="-138" y="-22" width="60" height="20" transform="scale(-1)"><div>{{R[20]}}</div></foreignObject><foreignObject x="6" y="104" width="60" height="20" transform="rotate(-60)"><div>{{dis[5]}}</div></foreignObject><foreignObject x="42.5" y="-84" width="60" height="20" transform="rotate(60)"><div>{{dis[6]}}</div></foreignObject></g></svg>',
    pier12: '<svg id="pier12" width="747.879" height="1020.645" viewBox="0 0 197.876 270.046" xmlns="http://www.w3.org/2000/svg"><path d="M98.938 269.693v-72.17l62.5 36.085zm0-269.34v72.17l-62.5-36.086zm0 72.169V.352l62.5 36.085z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M135.023 135.023h-72.17l36.085-62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path d="M.353 171.108v-72.17l62.5 36.085zm98.585 26.415v72.17l-62.5-36.085zm36.085-62.5l62.5-36.085v72.17zm-72.17 0h72.17l-36.085 62.5z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><path fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round" d="M36.556 36.505l62.382 36.017-36.016 62.382L.539 98.888zm98.517 98.704l62.382 36.016-36.016 62.382-62.383-36.016zM99.124 72.573l62.382-36.017 36.017 62.382-62.382 36.017zM.42 171.225l62.383-36.016L98.82 197.59l-62.383 36.017z"/><foreignObject x="56" y="-8.5" width="60" height="20" transform="rotate(30)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[8]}}</div></foreignObject><foreignObject x="97" y="16" width="60" height="20" transform="rotate(150 100 20)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[9]}}</div></foreignObject><foreignObject x="-66" y="77" width="60" height="20" transform="rotate(-90)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[9]}}</div></foreignObject><foreignObject x="56" y="90.5" width="60" height="20" transform="rotate(-30)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[0]}}</div></foreignObject><foreignObject x="6" y="-120.5" width="60" height="20" transform="rotate(90)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[9]}}</div></foreignObject><foreignObject x="-152" y="27.5" width="60" height="20" transform="rotate(-150)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[0]}}</div></foreignObject><foreignObject x="56" y="64" width="60" height="20" transform="rotate(30)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[7]}}</div></foreignObject><foreignObject x="19.5" y="-72" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[8]}}</div></foreignObject><foreignObject x="-116" y="-35" width="60" height="20" transform="rotate(-150)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[8]}}</div></foreignObject><foreignObject x="-79.5" y="100" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[13]}}</div></foreignObject><g transform="translate(13.5 23)"><foreignObject x="56" y="90.5" width="60" height="20"><div xmlns="http://www.w3.org/1999/xhtml">{{R[14]}}</div></foreignObject><foreignObject x="6" y="-120.5" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[13]}}</div></foreignObject><foreignObject x="-152" y="27.5" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[10]}}</div></foreignObject></g><g transform="translate(49 86)"><foreignObject x="56" y="64" width="60" height="20" transform="rotate(-30)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[1]}}</div></foreignObject><foreignObject x="19.5" y="-72" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[10]}}</div></foreignObject><foreignObject x="-116" y="-35" width="60" height="20" transform="rotate(-210)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[0]}}</div></foreignObject><foreignObject x="-79.5" y="100" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[1]}}</div></foreignObject></g><g transform="translate(-98.5 98.5)"><foreignObject x="56" y="90.5" width="60" height="20" transform="rotate(-30)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[6]}}</div></foreignObject><foreignObject x="6" y="-120.5" width="60" height="20" transform="rotate(90)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[7]}}</div></foreignObject><foreignObject x="-152" y="27.5" width="60" height="20" transform="rotate(-150)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[7]}}</div></foreignObject></g><g><foreignObject x="-129" y="-156" width="60" height="20" transform="scale(-1)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[14]}}</div></foreignObject><foreignObject x="-115.5" y="163" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[11]}}</div></foreignObject><foreignObject x="154" y="-8.5" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[12]}}</div></foreignObject></g><g transform="translate(98.5 98.5)"><foreignObject x="56" y="-8.5" width="60" height="20" transform="rotate(30)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[2]}}</div></foreignObject><foreignObject x="97" y="16" width="60" height="20" transform="rotate(150 100 20)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[1]}}</div></foreignObject><foreignObject x="-66" y="77" width="60" height="20" transform="rotate(-90)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[2]}}</div></foreignObject></g><g transform="translate(-49.5 184.5)"><foreignObject x="56" y="64" width="60" height="20" transform="rotate(-30)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[5]}}</div></foreignObject><foreignObject x="19.5" y="-72" width="60" height="20" transform="rotate(60)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[6]}}</div></foreignObject><foreignObject x="-116" y="-35" width="60" height="20" transform="rotate(-210)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[6]}}</div></foreignObject><foreignObject x="-79.5" y="100" width="60" height="20" transform="rotate(-120)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[12]}}</div></foreignObject></g><g transform="translate(98.5 98.5)"><foreignObject x="56" y="64" width="60" height="20" transform="rotate(30)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[3]}}</div></foreignObject><foreignObject x="19.5" y="-72" width="60" height="20" transform="rotate(120)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[11]}}</div></foreignObject><foreignObject x="-116" y="-35" width="60" height="20" transform="rotate(-150)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[2]}}</div></foreignObject><foreignObject x="-79.5" y="100" width="60" height="20" transform="rotate(-60)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[3]}}</div></foreignObject></g><g><g transform="translate(0 197.4)"><foreignObject x="56" y="-8.5" width="60" height="20" transform="rotate(30)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[5]}}</div></foreignObject><foreignObject x="97" y="16" width="60" height="20" transform="rotate(150 100 20)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[5]}}</div></foreignObject><foreignObject x="-66" y="77" width="60" height="20" transform="rotate(-90)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[4]}}</div></foreignObject></g><g transform="translate(0 197.4)"><foreignObject x="56" y="90.5" width="60" height="20" transform="rotate(-30)"><div xmlns="http://www.w3.org/1999/xhtml">{{dis[4]}}</div></foreignObject><foreignObject x="6" y="-120.5" width="60" height="20" transform="rotate(90)"><div xmlns="http://www.w3.org/1999/xhtml">{{R[4]}}</div></foreignObject><foreignObject x="-152" y="27.5" width="60" height="20" transform="rotate(-150)"><div xmlns="http://www.w3.org/1999/xhtml">{{Q[3]}}</div></foreignObject></g></g></svg>'
}
const motifs = {
    trio8:"<svg class='svg8' width='720.504' height='1038.806' viewBox='0 0 190.633 274.851' xmlns='http://www.w3.org/2000/svg'><g fill='none' stroke='#1a1a1a' stroke-width='.705' stroke-linecap='round' stroke-linejoin='round'><path d='M95.316 110.009V.353L190.28 55.18zm0 109.659V110.012l94.965 54.828zm0-109.659V.353L.35 55.18zm0 109.659V110.012L.35 164.84z'/><path d='M.353 164.839V55.183l94.965 54.828z'/><path d='M190.279 164.839V55.183L95.314 110.01zm0 109.659V164.842L95.314 219.67z'/><path d='M.353 274.498V164.842l94.965 54.828z'/></g><foreignObject x='43' y='26' width='80' height='20' transform='rotate(30)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[0][0]}}</div></foreignObject><foreignObject x='-67' y='-70' width='80' height='20' transform='rotate(150)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[0][1]}}</div></foreignObject><foreignObject x='-96' y='73' width='80' height='20' transform='rotate(-90)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[0][2]}}</div></foreignObject><g transform='translate(0 109.5)'><foreignObject x='43' y='26' width='80' height='20' transform='rotate(30)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[2][0]}}</div></foreignObject><foreignObject x='-67' y='-70' width='80' height='20' transform='rotate(150)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[2][1]}}</div></foreignObject><foreignObject x='-96' y='73' width='80' height='20' transform='rotate(-90)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[2][2]}}</div></foreignObject></g><g transform='translate(94.8 54.75)'><foreignObject x='43' y='26' width='80' height='20' transform='rotate(30)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[3][0]}}</div></foreignObject><foreignObject x='-67' y='-70' width='80' height='20' transform='rotate(150)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[3][1]}}</div></foreignObject><foreignObject x='-96' y='73' width='80' height='20' transform='rotate(-90)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[3][2]}}</div></foreignObject></g><g transform='translate(94.8 164.3)'><foreignObject x='43' y='26' width='80' height='20' transform='rotate(30)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[4][0]}}</div></foreignObject><foreignObject x='-67' y='-70' width='80' height='20' transform='rotate(150)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[4][1]}}</div></foreignObject><foreignObject x='-96' y='73' width='80' height='20' transform='rotate(-90)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[4][2]}}</div></foreignObject></g><foreignObject x='-68' y='121' width='80' height='20' transform='rotate(-30)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[1][0]}}</div></foreignObject><foreignObject x='70' y='-22' width='80' height='20' transform='rotate(90)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[1][1]}}</div></foreignObject><foreignObject x='-123' y='-69' width='80' height='20' transform='rotate(-150)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[1][2]}}</div></foreignObject><g transform='translate(0 109.5)'><foreignObject x='-68' y='121' width='80' height='20' transform='rotate(-30)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[5][0]}}</div></foreignObject><foreignObject x='70' y='-22' width='80' height='20' transform='rotate(90)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[5][1]}}</div></foreignObject><foreignObject x='-123' y='-69' width='80' height='20' transform='rotate(-150)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[5][2]}}</div></foreignObject></g><g transform='translate(94.8 -54.75)'><foreignObject x='-68' y='121' width='80' height='20' transform='rotate(-30)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[6][0]}}</div></foreignObject><foreignObject x='70' y='-22' width='80' height='20' transform='rotate(90)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[6][1]}}</div></foreignObject><foreignObject x='-123' y='-69' width='80' height='20' transform='rotate(-150)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[6][2]}}</div></foreignObject></g><g transform='translate(94.8 54.75)'><foreignObject x='-68' y='121' width='80' height='20' transform='rotate(-30)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[7][0]}}</div></foreignObject><foreignObject x='70' y='-22' width='80' height='20' transform='rotate(90)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[7][1]}}</div></foreignObject><foreignObject x='-123' y='-69' width='80' height='20' transform='rotate(-150)'><div xmlns='http://www.w3.org/1999/xhtml'>{{P[7][2]}}</div></foreignObject></g></svg>",
    carr2:'<svg class="svg8" width="720.504" height="1038.806" viewBox="0 0 190.633 274.851" xmlns="http://www.w3.org/2000/svg"><path d="M40.496 27.786h109.64v109.64H40.496zm0 109.64h109.64v109.64H40.496z" fill="#fff" stroke="#1a1a1a" stroke-width=".706" stroke-linecap="round" stroke-linejoin="round"/><foreignObject x="55" y="115" width="80" height="20"><div>{{P[0][0]}}</div></foreignObject><foreignObject x="43" y="-62.5" width="80" height="20" transform="rotate(90)"><div>{{P[0][1]}}</div></foreignObject><foreignObject x="-122" y="128.5" width="80" height="20" transform="rotate(-90)"><div>{{P[0][3]}}</div></foreignObject><foreignObject x="-135" y="-50" width="80" height="20" transform="scale(-1)"><div>{{P[0][2]}}</div></foreignObject><g transform="translate(0 109.5)"><foreignObject x="55" y="115" width="80" height="20"><div>{{P[1][0]}}</div></foreignObject><foreignObject x="43" y="-62.5" width="80" height="20" transform="rotate(90)"><div>{{P[1][1]}}</div></foreignObject><foreignObject x="-122" y="128.5" width="80" height="20" transform="rotate(-90)"><div>{{P[1][3]}}</div></foreignObject><foreignObject x="-135" y="-50" width="80" height="20" transform="scale(-1)"><div>{{P[1][2]}}</div></foreignObject></g></svg>'
}
const setsOfValues = {
    pyr16: [
        ['Q[0]', 'dis[3]', 'dis[4]'],
        ['Q[3]', 'dis[2]', 'R[1]'],
        ['R[0]', 'R[2]', 'Q[1]'],
        ['R[4]', 'Q[2]', 'dis[5]'],
        ['Q[9]', 'dis[1]', 'R[5]'],
        ['R[3]', 'R[6]', 'Q[5]'],
        ['Q[10]', 'Q[6]', 'R[7]'],
        ['Q[4]', 'R[8]', 'Q[7]'],
        ['R[11]', 'Q[8]', 'dis[6]'],
        ['dis[11]', 'dis[0]', 'Q[12]'],
        ['R[9]', 'Q[13]', 'R[12]'],
        ['dis[10]', 'R[13]', 'Q[14]'],
        ['R[10]', 'Q[15]', 'R[14]'],
        ['dis[9]', 'R[15]', 'Q[16]'],
        ['Q[11]', 'R[17]', 'R[16]'],
        ['dis[8]', 'Q[17]', 'dis[7]']
    ],
    hexa24: [
        ['R[6]', 'dis[11]', 'Q[0]'],
        ['dis[0]', 'Q[1]', 'R[0]'],
        ['R[5]', 'R[1]', 'Q[2]'],
        ['dis[1]', 'Q[3]', 'R[2]'],
        ['Q[4]', 'R[3]', 'dis[2]'],
        ['R[16]', 'dis[10]', 'Q[7]'],
        ['Q[6]', 'R[8]', 'R[7]'],
        ['R[15]', 'Q[8]', 'R[9]'],
        ['Q[5]', 'R[10]', 'Q[9]'],
        ['R[14]', 'Q[10]', 'Q[11]'],
        ['R[4]', 'Q[12]', 'R[11]'],
        ['Q[13]', 'R[12]', 'dis[3]'],
        ['Q[16]', 'R[17]', 'dis[9]'],
        ['R[25]', 'Q[17]', 'R[18]'],
        ['Q[15]', 'R[19]', 'Q[18]'],
        ['R[24]', 'Q[19]', 'Q[20]'],
        ['Q[14]', 'Q[21]', 'R[20]'],
        ['Q[23]', 'R[21]', 'R[22]'],
        ['Q[13]', 'dis[4]', 'Q[22]'],
        ['Q[25]', 'R[26]', 'dis[8]'],
        ['dis[7]', 'Q[26]', 'R[27]'],
        ['Q[24]', 'R[28]', 'Q[27]'],
        ['dis[6]', 'Q[28]', 'R[29]'],
        ['R[23]', 'dis[5]', 'Q[29]']
    ],
    los18: [
        ['R[0]', 'dis[11]', 'dis[0]'],
        ['R[4]', 'dis[10]', 'Q[1]'],
        ['Q[0]', 'Q[2]', 'R[1]'],
        ['Q[3]', 'R[2]', 'dis[1]'],
        ['Q[9]', 'R[8]', 'dis[2]'],
        ['R[3]', 'Q[8]', 'R[7]'],
        ['R[10]', 'Q[6]', 'Q[7]'],
        ['Q[4]', 'R[6]', 'Q[5]'],
        ['R[11]', 'dis[9]', 'R[5]'],
        ['Q[11]', 'R[12]', 'dis[8]'],
        ['R[17]', 'Q[12]', 'Q[13]'],
        ['Q[10]', 'Q[14]', 'R[13]'],
        ['Q[16]', 'R[14]', 'R[15]'],
        ['R[9]', 'dis[3]', 'Q[15]'],
        ['R[16]', 'dis[4]', 'Q[19]'],
        ['Q[20]', 'Q[18]', 'R[19]'],
        ['Q[17]', 'R[18]', 'dis[7]'],
        ['R[20]', 'dis[5]', 'dis[6]']
    ],
    pier12: [
        ['R[8]', 'dis[9]', 'Q[9]'],
        ['Q[0]', 'R[9]', 'dis[0]'],
        ['R[14]', 'Q[13]', 'Q[10]'],
        ['Q[6]', 'dis[7]', 'R[7]'],
        ['Q[14]', 'R[11]', 'Q[12]'],
        ['Q[8]', 'R[1]', 'dis[2]'],
        ['R[5]', 'Q[4]', 'dis[5]'],
        ['dis[4]', 'R[4]', 'Q[3]'],
        ['Q[7]', 'dis[8]', 'Q[8]', 'R[13]'],
        ['R[10]', 'R[0]', 'dis[1]', 'Q[1]'],
        ['Q[5]', 'dis[6]', 'R[6]', 'R[12]'],
        ['R[3]', 'Q[11]', 'R[2]', 'dis[3]']
    ]
}
const distracteurs = {
    pyr16: 12,
    hexa24: 12,
    los18: 12,
    pier12: 10
}
const nbOfPairs = {
    pyr16: 18,
    hexa24: 30,
    los18: 21,
    pier12: 15
}
document.querySelectorAll('#puzzleChoice > article:not(:first-child)').forEach(el => {
    el.onclick = () => {
        const puzId = el.id.substring(4)
        if (puzzles.includes(puzId)) {
            type = puzId
            refresh()
        } else {
            console.log(puzId)
        }
        unselectOthersBtns()
        el.classList.add('selected')
    }
})
function unselectOthersBtns() {
    document.querySelectorAll('#puzzleChoice > article:not(:first-child)').forEach(el => {
        el.classList.remove('selected')
    })
}
function render(id) {
    // cas d'une classe
    if (id.indexOf('.')>-1){
        const contents = document.querySelectorAll(id)
        contents.forEach(el => {
            renderKtex(el)
        })
    } else { // cas d'un id
        const content = document.getElementById(id);
        renderKtex(content)
    }
}
function renderKtex() {
    utils.mathRender(parameters.fontType, ['creator-content'])
}
document.getElementById('radio-nodistract').onclick = () => {
    parameters.distract = false
    makePage()
    render(type)
    render('.svg8')
    setTextSize()
}
document.getElementById('radio-distract').onclick = () => {
    parameters.distract = true
    makePage()
    render(type)
    render('.svg8')
    setTextSize()
}
document.getElementById('formulaSize').oninput = (evt) => {
    setTextSize(evt.target.value)
}
function setTextSize(value) {
    if(value !== undefined)
        textSize = value
    else
        value = Number(document.getElementById('formulaSize').value)
    document.getElementById(type).style['font-size'] = String(value) + 'em'
    document.querySelectorAll('.svg8').forEach(el => {
        el.style['font-size'] = String(Number(value)*1.48571)+'em'
    })
}

function makePage(){
    const $fig = document.getElementById('puzzle')
    // Check du nombre de valeurs prévues
    let nbOfQuestions = 0
    if (parameters.alea){
        common.setSeed(parameters.alea);
    }
    // on ne veut pas de doublon sur les réponses.
    parameters.doublon = false
    const nbOfPieces = setsOfValues[type].length
    const nbOfActivities = parameters.cart.activities.length
    if(nbQuestionsOfActivities.length > 0) {
        for (let actid = 0; actid < nbOfActivities; actid++) {
            parameters.cart.activities[actid].nbq = Number(nbQuestionsOfActivities[actid]);
            nbOfQuestions += Number(nbQuestionsOfActivities[actid])
        }
    } else {
        for (let actid = 0; actid < nbOfActivities; actid++) {
            nbQuestionsOfActivities[actid] = Number(parameters.cart.activities[actid].nbq);
            nbOfQuestions += Number(parameters.cart.activities[actid].nbq)
        }
    }
    let total = 0
    for (const value of nbQuestionsOfActivities){
        total += Number(value)
    }
    $info.innerHTML = ''
    if(nbOfQuestions < nbOfPairs[type]) {
        $info.innerHTML = 'Pas assez de questions sélectionnées. Je complète selon le même ratio'
        const manque = nbOfPairs[type] - nbOfQuestions
        for (let actid = 0; actid < nbOfActivities; actid++){
            parameters.cart.activities[actid].nbq = Math.ceil(nbQuestionsOfActivities[actid] + manque/total*nbQuestionsOfActivities[actid])
            nbQuestionsOfActivities[actid] = parameters.cart.activities[actid].nbq
        }
    }
    $fig.innerHTML = ""
    MM.memory = {};
    common.generateQuestions(parameters);
    // set elements :
    let aleaCode = utils.create("div",{innerHTML:"Clé : "+common.seed});
    $info.appendChild(aleaCode);
    // get the titlesheet
    let sheetTitle = parameters.titreFiche||"Puzzle MathsMentales";
    // set the titlesheet
    let header = utils.create("header",{innerHTML:sheetTitle});
    $info.appendChild(header);
    const Q = [], R = []; let dis = [], pairs = [];
    for(let i=0;i<nbOfActivities;i++){
        const activity = parameters.cart.activities[i];
        for(let j=0;j<activity.questions.length;j++){
            let value = (Array.isArray(activity.values[j]))?activity.values[j][0]:activity.values[j];
            if (String(value).indexOf(',') > -1)
                value = value.split(',')[MMmath.aleaInt(0, value.split(',').length-1)]
        if(activity.type === "latex" || activity.type === "" || activity.type === undefined){
                let span = utils.create("span");
                span.innerHTML = '$$'+activity.questions[j]+'$$'
                let spanCorrection = utils.create("span");
                spanCorrection.innerHTML = '$$'+value+'$$'
                pairs.push([span.outerHTML, spanCorrection.outerHTML])
            } else {
                pairs.push([activity.questions[j], '$$'+value+'$$'])
            }    
        }
    }
    // On alimente Q et R
    // le mélange est nécessaire pour les cas où plusieurs activités ont été sélectionnées
    pairs = utils.shuffle(pairs)
    for (const pair of pairs) {
        Q.push(pair[0])
        R.push(pair[1])
    }
    // On alimente dis
    if(parameters.distract) {
        for (let i=0;i<nbOfActivities;i++) {
            parameters.cart.activities[i].nbq = Math.ceil(distracteurs[type]/total*nbQuestionsOfActivities[i])
        }
        common.generateQuestions(parameters)
        for(let i=0;i<nbOfActivities;i++){
            const activity = parameters.cart.activities[i];
            for(let j=0;j<activity.questions.length;j++){
                let value = (Array.isArray(activity.values[j]))?activity.values[j][0]:activity.values[j];
                if (String(value).indexOf(',') > -1){
                    value = value.split(',')[MMmath.aleaInt(0, value.split(',').length-1)]
                }
                if(activity.type === "latex" || activity.type === "" || activity.type === undefined){
                    let span = utils.create("span");
                    span.innerHTML = '$$'+activity.questions[j]+'$$'
                    let spanCorrection = utils.create("span");
                    spanCorrection.innerHTML = '$$'+value+'$$'
                    if (MMmath.aleaInt(0,1))
                        dis.push(span.outerHTML)
                    else
                        dis.push(spanCorrection.outerHTML)
                } else {
                    if (MMmath.aleaInt(0,1))
                        dis.push(activity.questions[j])
                    else {
                        dis.push('$$'+value+'$$')
                    }
                }    
            }
        }
        dis = utils.shuffle(dis)
    } else {
        dis = new Array(distracteurs[type]).fill('')
    }
    //$fig.innerHTML = figures[type]
    $fig.innerHTML = figures[type].replace(/\{\{(\w+)\[(\d+)\]\}\}/g, (match, arrayName, index) => {
        const idx = parseInt(index, 10); // Convertit l'index en nombre
        // Utilisation d'un switch pour vérifier le bon tableau à utiliser
        switch (arrayName) {
            case 'Q': return Q[idx] || match;
            case 'R': return R[idx] || match;
            case 'dis': return dis[idx] !== undefined ? dis[idx] : match;
            default: return match; // Si aucun tableau ne correspond, garde le placeholder
        }
    });
    let workSet3 = []
    let workSet4 = []
    let figs = ''
    let empty = ''
    for(const miniset of setsOfValues[type]){
        if(miniset.length === 3) workSet3.push(miniset)
        else if(miniset.length === 4) workSet4.push(miniset)
        else console.warn('makePage error', 'miniset de mauvaise taille', miniset)
    }
    if(workSet3.length > 0){
        const sets = []
        if (workSet3.length > 8) {
            const nbOfSets = Math.ceil(workSet3.length/8) - 1
            for (let x=0; x<nbOfSets; x++){
                sets.push([])
            }
        }
        for (let [index, set] of sets.entries()){
            let count = 0
            while(workSet3.length > 8 && count < 8) {
                set = set.concat(workSet3.splice(MMmath.aleaInt(0,workSet3.length-1),1))
                count++
            }
            sets[index] = set
        }
        utils.shuffle(workSet3)
    
        let fig0 = motifs.trio8;
        for (let i=0, len=workSet3.length; i<len; i++){
            for(let j=0; j<3; j++){
                fig0 = fig0.replace('P['+i+']['+j+']', workSet3[i][j])
            }
        }
        figs += fig0
        for(let set of sets) {
            let fig = motifs.trio8
            for (let i=0, len=set.length; i<len; i++){
                for(let j=0; j<3; j++){
                    fig = fig.replace('P['+i+']['+j+']', set[i][j])
                }
            }
            if(set.length < 8) {
                for (let i=set.length; i < 8; i++) {
                    for(let j=0; j<3; j++){
                        fig = fig.replace('P['+i+']['+j+']', 'empty'+empty)
                    }
                }
            }
            figs += fig
        }
    }
    if(workSet4.length > 0){
        const sets = []
        if (workSet4.length > 2) {
            const nbOfSets = Math.ceil(workSet4.length/2) - 1
            for (let x=0; x<nbOfSets; x++){
                sets.push([])
            }
        }
        for (let [index, set] of sets.entries()){
            let count = 0
            while(workSet4.length > 2 && count < 2) {
                set = set.concat(workSet4.splice(MMmath.aleaInt(0,workSet4.length-1),1))
                count++
            }
            sets[index] = set
        }
        utils.shuffle(workSet4)
        let fig0 = motifs.carr2;
        for (let i=0, len=workSet4.length; i<len; i++){
            for(let j=0; j<4; j++){
                fig0 = fig0.replace('P['+i+']['+j+']', workSet4[i][j])
            }
        }
        figs += fig0
        for(let set of sets) {
            let fig = motifs.carr2
            for (let i=0, len=set.length; i<len; i++){
                for(let j=0; j<4; j++){
                    fig = fig.replace('P['+i+']['+j+']', set[i][j])
                }
            }
            if(set.length < 8) {
                for (let i=set.length; i < 8; i++) {
                    for(let j=0; j<4; j++){
                        fig = fig.replace('P['+i+']['+j+']', 'empty')
                    }
                }
            }
            figs += fig
        }
    }
    document.getElementById('impression').innerHTML = figs.replace(/\{\{(\w+)\[(\d+)\]\}\}/g, (match, arrayName, index) => {
        const idx = parseInt(index, 10); // Convertit l'index en nombre
        // Utilisation d'un switch pour vérifier le bon tableau à utiliser
        switch (arrayName) {
            case 'Q': return Q[idx] || match;
            case 'R': return R[idx] || match;
            case 'dis': return dis[idx] !== undefined ? dis[idx] : match;
            default: return match; // Si aucun tableau ne correspond, garde le placeholder
        }
    });
}

function refresh(){
    makePage()
    render(type)
    render('.svg8')
    setTextSize()
}

function checkURL(urlString){
    const vars = utils.getUrlVars(urlString);
    if(vars.embed !== undefined){
        // cas d'une activité embeded, on vérifie que l'url est conforme
        let expression = 
/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
        let regex = new RegExp(expression);
        if(vars.embed.match(regex))
            MM.embededIn = vars.embed;
    }
    // Add Button Edit parameters of document
    // check if window has been opened directly
    if (window.opener === null) {
        const $destination = document.body;
        const buttonEdit = utils.create('button', {
            innerHTML: '🖋️ Éditer',
            className: 'noprint abstopright',
            title:'Éditer les activités du puzzle' });
        buttonEdit.onclick = () => {
            let url = window.location.href.replace('puzzle.html', 'index.html') + '&edit&type=puzzle';
            // add alea key
            url = url.replace(/,a=[\d\w]*,/, ',a=' + parameters.alea + ',');
            window.location.href = url
        }
        $destination.prepend(buttonEdit);
    }
    if(vars.c!==undefined){
        if(vars.a){
            parameters.alea = vars.a;
        } else {
            parameters.alea = common.setSeed();
        }
        // paramètres des activités des paniers
        let json = vars.c;
        // alcarts contient des promises qu'il faut charger
        parameters.cart = new cart(0);
        parameters.fontType = vars.fs
        parameters.cart.import(json[0],false, MM.version).then(()=>{
            refresh()
        }).catch(err=>{
            // erreur à l'importation :(
            let alert=utils.create("div",
            {
                id:"messageerreur",
                className:"message",
                innerHTML:"Impossible de charger le panier :(<br>"+err
            });
            $info.appendChild(alert);
            console.warn(err)
        });
    }
}
checkURL();