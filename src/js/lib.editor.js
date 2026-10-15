import activity from './mods/activity.js'
import MM from './mods/MM.js'
import utils from './mods/utils.js'
import library from './mods/library.js'

const activitiesIDs = []
const activitiesURLs =[]

MM.content = library.openContents();
for (const niv of Object.values(MM.content)){
    if(niv.themes === undefined) continue
    for(const theme of Object.values(niv.themes)){
        for(const chap of Object.values(theme.chapitres)){
            for (const id of Object.values(chap.e)){
                if(!activitiesIDs.includes(id)){
                    activitiesIDs.push(id)
                    activitiesURLs.push(undefined)
                }
            }
        }
    }
}

const editorDOMElement = document.getElementById('ide')
const options = {
    modes: ['text', 'code', 'tree', 'form', 'view'],
    mode:'code',
    onEditable: function (node) {
        // node is an object like:
        //   {
        //     field: 'FIELD',
        //     value: 'VALUE',
        //     path: ['PATH', 'TO', 'NODE']
        //   }
        switch (node.field) {
            case 'ID':
                return false

            case 'title':
                return {
                    field: false,
                    value: true
                }
            case 'dest':
                return {
                    field: false,
                    value: true
                }
            default:
                return true
        }
    }
}
let initialJson = {
    "title":"Titre de l’activité",
    "type":"latex",
    "dest":["chap1","chap2"],
    "options":[
        {
            "name":"Multiplications",
            "vars":{
                "a":"2_10",
                "b":"2_10"
            },
            "question":"${:a}\\times${:b}",
            "answer":":question=\\color{red}{${:a*:b}}"
        },{
            "name":"Divisions",
            "vars":{
                "a":"2_10",
                "b":"2_10"
            },
            "question":"${:a*:b}\\div${:b}",
            "answer":":question=\\color{red}{${:a}}"
        }
    ]
}
function saveJson() {
    const jsonString = editor.getText()
    localStorage.setItem('activityEditor', jsonString)
}
function loadJson() {
    const jsonString = localStorage.getItem('activityEditor')
    if (jsonString){
       initialJson = JSON.parse(jsonString)
    }
}
loadJson()
const editor = new JSONEditor(editorDOMElement, options, initialJson)
document.getElementById('saveBtn').onclick = () => {
    const blob = new Blob([editor.getText()],{
        type: 'application/json;charset:utf-8'
    })
    const fileName = "activity.json";
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // For IE
        window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
        // For other browsers
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    saveJson()
}
document.getElementById('testBtn').onclick = () => {
    const act = new activity(editor.get())
    document.getElementById('errors').innerHTML = '';
    MM.editedActivity = act
    act.display('sample',MM)
    saveJson()
}
document.getElementById('actIDImport').oninput = async (evt) => {
    const id = evt.target.value
    if (activitiesIDs.includes(id)){
        const index = activitiesIDs.indexOf(id)
        const json = await library.load(activitiesURLs[index])
        editor.set(json[0])
        saveJson()
        try {
            const act = new activity(json[0])
            MM.editedActivity = act
            act.display('sample',MM)
        }
        catch (err) {
            document.getElementById('activityTitle').innerHTML = "<span class='red'>Erreur dans le code</span>"+err
        }
    }
}
document.getElementById('randomBtn').onclick = async()=>{
    // set json
    const json = library.load(activitiesURLs[Math.floor(Math.random()*activitiesIDs.length)])
    editor.set(json[0])
    saveJson()
    try {
    const act = new activity(editor.get())
    MM.editedActivity = act
    act.display('sample',MM)
    } catch (err){
            document.getElementById('activityTitle').innerHTML = "<span class='red'>Erreur dans le code</span>"+err
    }
}
document.getElementById('openFileInput').onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonContent = JSON.parse(e.target.result);
            editor.set(jsonContent);
            saveJson()
            try{
                const act = new activity(editor.get())
                MM.editedActivity = act
                act.display('sample',MM)
            }catch(err){
                document.getElementById('activityTitle').innerHTML = "<span class='red'>Erreur dans le code</span>"+err
            }
        } catch (error) {
            utils.debug("Error parsing JSON: ", error);
        }
    };
    reader.readAsText(file);
};
setTimeout(()=>{
    const act = new activity(editor.get())
    try {
        MM.editedActivity = act
        act.display('sample',MM)
    } catch (err){
        document.getElementById('activityTitle').innerHTML = "<span class='red'>Erreur dans le code</span>"+err
    }
},1000)
