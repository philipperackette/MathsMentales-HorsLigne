// Node.js
// F8 pour lancer dans Visual Studio Code
// Analyse la structure et crée le fichier de référence aux exercices
// remplace le fichier scan.php
const fs = require("fs");
const path = require("path");
const yaml = require('js-yaml');

const listOfActivities = {};
const activities = {};
const { off } = require("process");
// IDs utilisés dans les pages src/automatismes-*.html et src/brevet-2025.html
const feuilleActivities = new Set(["11NA5","2N13","3AA1","3DD5","3DD6","3ND2","3ND4","4DC3","4GB1","4GB10","4GB2","4GB4","4GB5","4GB7","4GB8","4GB9","4NA1","4NA5","4NA6","4NC1","4NC3","4NC4","4NC7","4NC8","4NE10","4NE2","4NE4","4NE5","4NE6","4NE7","4NE8","4NE9","5AA1","5AA2","5AA3","5AA4","5AA5","5DA1","5DA2","5DA3","5DC1","5DC3","5DC4","5DC5","5GA1","5GA2","5GA3","5GA4","5GB1","5GB10","5GB11","5GB2","5GB3","5GB8","5GB9","5GR1","5GR2","5GT2","5GT5","5GT6","5LD1","5LG1","5LG2","5LG3","5LM1","5LN2","5LN3","5MA2","5MA4","5NA10","5NA2","5NA4","5NA5","5NA6","5NA7","5NA8","5NC1","5NC10","5NC12","5NC13","5NC14","5NC15","5NC16","5NC2","5NC5","5NC6","5NC7","5NC8","5NC9","5ND2","5NE1","5NE11","5NE12","5NE2","5NE3","5NE4","5NE5","5NE8","5NE9","6DA3","6DA5","6DA6","6DA7","6GC11","6GC12","6GC13","6GC15","6GD4","6GD6","6GD9","6MA1","6MA2","6MC1","6MC3","6MC6","6MC7","6MD1","6ME5","6NA4","6NB1","6NB10","6NB11","6NB2","6NB3","6NB4","6NB5","6NB6","6NB7","6NB8","6NB9","6NC1","6NC11","6NC14","6ND10","6ND11","6ND12","6ND13","6ND14","6ND27","6ND28","6NE11","6NE5","7MA1","7MA2","7MC2","7MC3","7MC4","7NB1","7NF1","8GC2","8GC3","8GC4","8GC5","8MA1","8MA2","8MB1","8MC1","8MC2","8MC3","8ME1","8MG1","8NB5","8ND5","8NE2","8NE3","8NE4","8NE5","8NE6","8NE8","9MA1"]);
const getAllFiles = function(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath)
  arrayOfFiles = arrayOfFiles || []
 
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      // on stocke la date de création du fichier
      arrayOfFiles.push([
                      file, // nom du fichier
                      path.join(__dirname, dirPath, "/", file), // chemin du fichier local
                      fs.statSync(dirPath + "/" + file).birthtime, // date de création du fichier
                      path.join(dirPath, "/", file) // chemin du fichier relatif
                    ])
    }
  })
  return arrayOfFiles
};
const structure = JSON.parse(fs.readFileSync("./structure.json"));
// initialisation du nombre de fichiers/activités
structure.activitiesNumber=0;
for (let niveau in structure){
  // initialisation du nombre d'activités par niveau.
  structure[niveau].activitiesNumber=0;
  for(let theme in structure[niveau].themes){
    for (let chapter in structure[niveau].themes[theme].chapitres){
      structure[niveau].themes[theme].chapitres[chapter] = {
        "n":structure[niveau].themes[theme].chapitres[chapter],//name
        e:[]};//exercices
    }
  }
}
for (const niveau in structure){
  let now = new Date().getTime()-15*24*3600*1000;
  if(niveau === "activitiesNumber")continue;
  let listOfFiles = getAllFiles("./N"+niveau);
  listOfFiles.forEach(function(fichierExo){
    let nouveau = false;
    let dt = new Date(fichierExo[2]).getTime();
    if(dt > now){nouveau = true;console.log(fichierExo[0])}
    //console.log(fichierExo);
    let json
    const fileContent = fs.readFileSync(fichierExo[1])
    if (fichierExo[0].indexOf('.json')>-1)
      json = JSON.parse(fileContent);
    else if(fichierExo[0].indexOf('.yml')>-1) {
      json = yaml.load(fileContent)
    }
    const ID = fichierExo[0].replace('.json', '').replace('.yml','')
    listOfActivities[ID]=json;
    listOfActivities[ID].url = fichierExo[3]
    let exo = {"t":json.title+(json.speech?" 📣":"")+(feuilleActivities.has(ID)?" 📃":"")};
    if(nouveau) exo.new = true;
    // descriptif
    if(json.description !== undefined){
      exo.d = json.description;
    }
    activities[ID] = exo;
    structure.activitiesNumber++;
    for(let i in json.dest){
      let codechap = json.dest[i];
      let destLevel = codechap.match(/(^\d+|T|G|K|H)/i)[0];
      let themecode = codechap.match(/^(\d+|T|G|K|H)[A-Z]/i)[0];
      if(structure[destLevel] !== undefined){
        structure[destLevel].activitiesNumber++;
        structure[destLevel].themes[themecode].chapitres[codechap].e.push(ID);
      }
    }
  })
}
// rangement alpha des exercices
for(const niveau in structure){
  for(const them in structure[niveau].themes){
    for (const chap in structure[niveau].themes[them].chapitres){
      if(structure[niveau].themes[them].chapitres[chap].e.length)
        structure[niveau].themes[them].chapitres[chap].e.sort((a,b)=>{
          return activities[a].t.localeCompare(activities[b].t, 'fr', { usage: 'sort'})
        })
    }
  }
}
// création d'un fichier html qui contient toutes les références aux exercices avec chacun un lien vers index.html?u=ID de l'exercice
fs.writeFileSync("../liste-des-exercices.html",
  "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'><title>Liste des exercices</title></head><body><h1>Liste des activités MathsMentales</h1><ol>"+
  Object.keys(listOfActivities).map(
    id => `<li><a href='index.html?u=${id}'>${listOfActivities[id].title}</a></li>`
  ).join("")+
  "</ol></body></html>"
);
const dataActivities = {}
Object.keys(listOfActivities).forEach(id => {dataActivities[id]=listOfActivities[id].url});
fs.writeFileSync("../../src/js/mods/activitiesurl.js","export {activitiesURL as default};"+
"const activitiesURL="+JSON.stringify(dataActivities));
let data = JSON.stringify(structure);
fs.writeFileSync("../../src/js/mods/content.js",
  "export {content as default, activities};" +
  "const activities="+JSON.stringify(activities)+";" +
  "const content="+data);
