import protos from './mods/protos.js';
import utils from './mods/utils.js';
import common from './mods/common.js';
import cart from './mods/cart.js';
import Zoom from './mods/zoom.js';
import Figure from './mods/figure.js';

const MM={};
MM.version = utils.getVersion()

const content = document.getElementById("creator-content");
const parameters = {
    fusions: [], // exercices supprimés (fusionnés avec le précédent) "fiche-index"
    titresEdites: {}, // html des titres modifiés, conservés à la régénération
    separation: false,
    encartReponse: true,
    corrige: true,
    sautPage: false,
};
let zoom;
document.getElementById("creator-menu").onclick = (evt)=>{
    if(evt.target.dataset.what === "in"){
        zoom.plus();
    } else if(evt.target.dataset.what === "out"){
        zoom.minus();
    } else if(evt.target.id === "fichesSeparation"){
        parameters.separation = !parameters.separation;
        document.getElementById(evt.target.id).innerText = parameters.separation ? "Regrouper" : "Séparer";
        refresh();
    } else if(evt.target.name === "encart"){
        parameters.encartReponse = evt.target.value === "oui";
        refresh();
    } else if(evt.target.name === "fusion"){
        // fusion oui : questions mélangées, non : regroupées par exercice
        parameters.cart.ordered = evt.target.value === "non";
        refresh();
    } else if(evt.target.name === "corrige"){
        parameters.corrige = evt.target.value === "oui";
        refresh();
    } else if(evt.target.name === "sautpage"){
        parameters.sautPage = evt.target.value === "oui";
        refresh();
    }
}
document.getElementById("creator-menu").oninput = (evt)=>{
    if(evt.target.id === "nbFiches"){
        setNumberFiches(evt.target.value);
    }
}
/**
 * gestion des click sur les éléments pour afficher les corrections
 */
document.getElementById("creator-content").onclick = (evt) => {
    if(evt.target.id.indexOf("idCorrige")===0){
        let target = document.getElementById(evt.target.id.replace("idCorrige","corrige"));
        if(target.classList.toggle("hidden")){
            document.getElementById(evt.target.id).classList.add("noprint");
        } else {
            document.getElementById(evt.target.id).classList.remove("noprint");
        }
    } else if(evt.target.id.indexOf('inputheight')===0){
        changeheight('ol'+evt.target.dataset.target,evt.target.value)
        applyPageBreaks()
    } else if(evt.target.id.indexOf('nbcols')===0){
        changecols('ol'+evt.target.dataset.target,evt.target.value)
        applyPageBreaks()
    }
}
function applyPageBreaks(){
    const pageHeightPx = utils.computePageHeightPx();
    for(let qty=0; qty<parameters.nb; qty++){
        const sections = Array.from(document.querySelectorAll('[id^="section'+qty+'-"]'));
        utils.insertAutoPageBreaks(sections, pageHeightPx);
    }
}
function changecols(dest,nb){
    const elem = document.getElementById(dest)
    if(elem !== null)
        elem.className="grid g"+nb
}
function changeheight(dest,nb){
    let elts = document.querySelectorAll("#"+dest+" .interro article");
    for(let i=0;i<elts.length;i++){
        elts[i].style.height = nb+"pt";
    }
}
function setNumberFiches(nb){
    parameters.nb = Number(nb);
    refresh();
}
function makePage(){
    if(parameters.alea){
        common.setSeed(parameters.alea);
    }
    content.innerHTML = "";
    // le saut de page avant le corrigé n'a de sens que s'il est en fin de fiche
    document.getElementById('btpCorrigePlace').classList.toggle("hidden", !(parameters.positionCorrection === "end" && parameters.corrige));
    MM.memory = {};
    for(let qty=0; qty<parameters.nb; qty++){
        common.generateQuestions(parameters);
        // si plus d'une interro, on introduit un pagebreak
        if(qty>0)
            content.appendChild(utils.create("footer",{className:"footer-end"+((parameters.separation || (parameters.corrige && parameters.sautPage)) ? " break" : "")}));
        // set elements :
        const aleaCode = utils.create("div",{className:"floatright",innerHTML:"p."+(qty+1)})
        content.appendChild(aleaCode);
        // get the titlesheet
        const sheetTitle = parameters.titreFiche;
        // set the titlesheet
        const header = utils.makeEditableTitle("header", parameters.titresEdites["fiche"+qty] ?? sheetTitle, {id:"titreFiche"+qty});
        header.dataset.key = "fiche"+qty;
        content.appendChild(header);
        const div1 = utils.create("div",{className:"studenName",innerHTML:"Nom, prénom, classe :"});
        content.appendChild(div1);
        const div2 = utils.create("div",{className:"remarques",innerHTML:"Remarques :"});
        content.appendChild(div2);
        // get the exercice title
        let exTitle = parameters.titreExercices;
        const correctionContent = utils.create("div",{className:"correction"});
        const titleCorrection = utils.create("header", {className:"clearfix",innerHTML:"Correction"});
        correctionContent.appendChild(titleCorrection);
        const divclear = utils.create("div",{className: "clearfix"});
        let activitiesArray = []
        for (let i=0; i<parameters.cart.activities.length;i++){
            for (let j=0;j<parameters.cart.activities[i].questions.length;j++){
                activitiesArray.push([i,j])
            }
        }
        if(!parameters.cart.ordered){
            activitiesArray = utils.shuffle(activitiesArray)
        }
        let lastActivityIndex = 0,ol,olCorrection,h3,input,activityTitle
        let sectionEnonce, sectionCorrection
        for (let i = 0; i < activitiesArray.length; i++) {
            const actIndex = activitiesArray[i][0]
            const activity = parameters.cart.activities[actIndex]
            const j = activitiesArray[i][1]
            // à revoir, une seule section par type d'exercice nécessaire.
            if((lastActivityIndex !== actIndex && parameters.cart.ordered) || i===0){
                sectionEnonce = utils.create("section",{id:"section"+qty+"-"+i})
                content.appendChild(sectionEnonce);
                sectionCorrection = utils.create("section",{id:"sectionCorrige"+qty+"-"+i})
                correctionContent.appendChild(sectionCorrection);
                input = `<input id="inputheight${qty}-${i}" class="noprint fright" value="30" title="Taille réponse" type="number" size="3" min="10" max="200" data-target="${qty}-${i}">`;
                sectionEnonce.innerHTML += input;
                input = `<input id="nbcols${qty}-${i}" class="noprint fright" value="2" title="Nb de colonnes" type="number" size="2" min="1" max="6" data-target="${qty}-${i}">`;
                sectionEnonce.innerHTML += input;
                if(!parameters.cart.ordered){
                    activityTitle = exTitle+" :"
                } else {
                    activityTitle = exTitle+(actIndex+1)+" : "+activity.title
                }
                h3 = utils.makeEditableTitle("h3", parameters.titresEdites["exo"+qty+"-"+i] ?? activityTitle, {className:"exercice-title"});
                h3.dataset.key = "exo"+qty+"-"+i;
                h3.id = "titreExo"+qty+"-"+i;
                if(parameters.cart.ordered && i>0){
                    const suppr = utils.create("span",{className:"delete-icon noprint",innerHTML:"🗑️",title:"Supprimer ce titre et fusionner avec l'exercice précédent"});
                    const section = sectionEnonce;
                    suppr.onclick = (evt)=>{
                        evt.stopPropagation();
                        const m = section.id.match(/^section(\d+-\d+)$/);
                        if(m && mergeWithPrevious(section)) parameters.fusions.push(m[1]);
                    };
                    h3.appendChild(suppr);
                }
                sectionEnonce.appendChild(h3);
                if(activity.consigne){
                    sectionEnonce.appendChild(utils.create('div',{className:'consigne',innerHTML:activity.consigne}))
                }
                ol = utils.create("ol",{id:"ol"+qty+"-"+i,className:"grid g2"});
                olCorrection = utils.create("ol", {id:"corrige"+qty+"-"+i, className:"corrige"})
            }
            const li = utils.create("li",{className:"interro"});
            const liCorrection = utils.create("li");
            if(activity.type === "latex" || activity.type === "" || activity.type === undefined){
                const span = utils.create("span",{innerHTML:'$$'+activity.questions[j]+'$$'});
                const spanCorrection = utils.create("span", {innerHTML:'$$'+activity.answers[j]+'$$'});
                li.appendChild(span);
                liCorrection.appendChild(spanCorrection);
            } else {
                li.innerHTML = activity.questions[j];
                liCorrection.innerHTML = activity.answers[j];
            }
            ol.appendChild(li);
            // figures
            if(activity.figures[j] !== undefined){
                //if(i===0 && j=== 0)MM.memory["dest"] = this.wsheet;
                MM.memory["f"+qty+"-"+i+"-"+j] = new Figure(utils.clone(activity.figures[j]), "f"+qty+"-"+i+"-"+j,li);
            }
            if(activity.figuresCorrection[j] !== undefined){
                MM.memory["f"+qty+"-"+i+"-"+j+"-correction"] = new Figure(utils.clone(activity.figuresCorrection[j]), "f"+qty+"-"+i+"-"+j+"-correction",liCorrection);
            }

            const article = utils.create("article",{className: parameters.encartReponse ? "" : "invisible"});
            li.appendChild(article);
            olCorrection.appendChild(liCorrection);
            sectionEnonce.appendChild(ol);
            const ds = divclear.cloneNode(true);
            sectionEnonce.appendChild(ds);
            if((lastActivityIndex !== actIndex && parameters.cart.ordered) || i===0){
                const h3correction = h3.cloneNode(true);
                h3correction.querySelectorAll(".edit-icon, .delete-icon").forEach(el=>el.remove());
                h3correction.removeAttribute("id");
                sectionCorrection.appendChild(h3correction);
                lastActivityIndex = actIndex
            }
            sectionCorrection.appendChild(olCorrection);
        }
        // insert footer for print page break
        const footer = utils.create("footer", {className: 'footer-enonce'+(parameters.sautPage ? " break" : "")});
        content.appendChild(footer);
        // insert correction
        if(parameters.corrige)
            content.appendChild(correctionContent);
        const ds = divclear.cloneNode(true);
        content.appendChild(ds);
        // réapplique les fusions d'exercices faites avant la régénération
        parameters.fusions.filter(f=>f.startsWith(qty+"-")).forEach(f=>{
            const section = document.getElementById("section"+f);
            if(section) mergeWithPrevious(section);
        });
    }
    if(!utils.isEmpty(MM.memory)){
        setTimeout(function(){
            for(const k in MM.memory){
                if(k!=="dest")
                    MM.memory[k].display();
            }
            applyPageBreaks();
        }, 300);
    } else {
        setTimeout(function(){
            applyPageBreaks();
        }, 300);
    }
}
/**
 * exercice supprimé : ses questions (et corrigés) sont fusionnés
 * avec l'exercice précédent de la même fiche
 */
function mergeWithPrevious(section){
    const m = section.id.match(/^section(\d+)-(\d+)$/);
    if(!m) return false;
    const [, qty, i] = m;
    const sections = Array.from(content.querySelectorAll('[id^="section'+qty+'-"]'));
    const prev = sections[sections.indexOf(section)-1];
    if(!prev) return false;
    const prevI = prev.id.replace("section"+qty+"-","");
    [["ol","ol"],["corrige","corrige"]].forEach(([src,dest])=>{
        const from = document.getElementById(src+qty+"-"+i);
        const to = document.getElementById(dest+qty+"-"+prevI);
        while(from && to && from.firstChild) to.appendChild(from.firstChild);
    });
    section.remove();
    document.getElementById("sectionCorrige"+qty+"-"+i)?.remove();
    renumberExercises(qty);
    applyPageBreaks();
    return true;
}
// renumérote les titres restants au format "<Exercice n°>N : ..." et
// recopie les titres dans le corrigé
function renumberExercises(qty){
    const prefix = parameters.titreExercices || "Exercice n°";
    const re = new RegExp("^"+prefix.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\d+");
    let n = 1;
    content.querySelectorAll('[id^="section'+qty+'-"] > h3').forEach(h3=>{
        const text = h3.querySelector(".editable-text");
        if(text.textContent.startsWith(prefix)){
            text.innerHTML = text.innerHTML.replace(re, prefix+n);
        }
        n++;
        const suffix = h3.id.replace("titreExo","");
        const copie = document.querySelector("#sectionCorrige"+suffix+" > h3 .editable-text");
        if(copie) copie.innerHTML = text.innerHTML;
    });
}
// mémorise les titres modifiés pour les retrouver à la régénération
content.addEventListener("focusout", (evt)=>{
    const text = evt.target.closest?.(".editable-text");
    const key = text?.parentElement?.dataset.key;
    if(key) parameters.titresEdites[key] = text.innerHTML;
});
function refresh(){
    makePage()
    utils.mathRender(parameters.fontType)
    content.oninput = (evt)=>{
        if(evt.target.nodeName.toLowerCase()==="input"){
            changecols(evt.target.dataset.dest,evt.target.value)
        }
    }
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
            title:'Éditer les activités de la feuille' });
        buttonEdit.onclick = () => {
            let url = window.location.href.replace('exam.html', 'index.html') + '&edit&type=exam';
            // add alea key
            url = url.replace(/,a=[\d\w]*,/, ',a=' + parameters.alea + ',');
            window.location.href = url
        }
        $destination.prepend(buttonEdit);
    }

    if(vars.c!==undefined){ // présence de carts MM v2 à lancer ou éditer
        // le seed d'aléatorisation est fourni et on n'est pas en mode online
        if(vars.a){
            parameters.alea = vars.a;
        } else {
            parameters.alea = common.setSeed();
        }
        // paramètres des activités des paniers
        let json = vars.c;
        // parametres globaux :
        parameters.fontType = vars.fs??'serif'
        parameters.tailleTexte=Number(vars.s);
        parameters.nb=Number(vars.n);
        parameters.positionCorrection=vars.cor||'end';
        parameters.titreFiche=decodeURI(vars.t);
        parameters.titreExercices=decodeURI(vars.ex).trim()+" ".replace("📣","");
        parameters.enoncesSepares=vars.es||0;
        parameters.corrigeSepare=vars.cs||0;
        parameters.activitesColonnes=vars.cols||[];
        parameters.doublons = true;
        if(!Array.isArray(parameters.activitesColonnes)){
            parameters.activitesColonnes.split("~");
        }
        parameters.corrigesVisibles=vars.cv||[];
        if(!Array.isArray(parameters.corrigesVisibles)){
            parameters.corrigesVisibles.split("~");
        }
        // Affectation de la valeur au nombre de feuilles
        document.getElementById("nbFiches").value = parameters.nb;
        zoom = new Zoom("changeFontSize","#thehtml",true,"pt",parameters.tailleTexte);
        document.getElementById("fontSize").appendChild(zoom.createCursor());
        document.querySelector("html").style["fontSize"] = parameters.tailleTexte+"pt";
        // alcarts contient des promises qu'il faut charger
        parameters.cart = new cart(0);
        parameters.cart.import(json[0],false,MM.version).then(()=>{
            document.getElementById(parameters.cart.ordered ? "fusion-non" : "fusion-oui").checked = true;
            refresh()
        }).catch(err=>{
            // erreur à l'importation :(
            let alert=utils.create("div",
            {
                id:"messageerreur",
                className:"message",
                innerHTML:"Impossible de charger le panier :(<br>"+err
            });
            document.getElementById("tab-accueil").appendChild(alert);
        });
    }
}
checkURL();
        