const gulp = require("gulp");
const uglify = require("gulp-uglify");
const rollupStream = require("@rollup/stream");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const cleanCSS = require("gulp-clean-css");
const concat = require("gulp-concat");
const fs = require("fs");
const path = require("path");

/*
à faire dans le terminal de VSC
lancer "gulp" pour une maj générale (modif d'un module touchant les autres, par exemple)
lancer "gulp maj-ceinture" lors d'une modif ne touchant que ceinture
lancer "gulp minify-js-ceinture" pour minifier uniquement le js de l'appli ceinture
lancer "gulp minify-css-ceinture" pour minifier uniquement le css de l'appli ceinture
lancer "gulp update-version-ceinture" pour modifier les version d'appel des fichiers css et js dans les fichiers html
// changement de version de MM
"gulp bump-major" pour une grosse mise à jour (gros changement du site)
"gulp bump-minor" pour une petite mise à jour (nouvelle fonctionnalité par exemple)
"gulp bump-patch" pour un patch (correction de bug, ajout d'activité)
*/

// création des dossiers ./public/css et ./public/js si inexistants
// create public/js directory if not exist
if (!fs.existsSync("./public/js")) {
  fs.mkdirSync("./public/js");
}
if (!fs.existsSync("./public/css")) {
  fs.mkdirSync("./public/css");
}

const builds = [
  "mathsmentales",
  "cartesflash",
  "ceinture",
  "courseauxnombres",
  "dominos",
  "duel",
  "editor",
  "editoryaml",
  "exam",
  "exercices",
  "wall",
  "puzzle",
  "diaporama",
  "jaiquia",
  "fichememo",
  "match",
  "parkour",
  "parkoureditor",
];

const packageJsonPath = path.join(__dirname, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

async function bumpVersion(options) {
  const versionParts = packageJson.version.split(".");

  let major = parseInt(versionParts[0]);
  let minor = parseInt(versionParts[1]);
  let patch = parseInt(versionParts[2]);

  if (options.major) {
    major++;
    minor = 0;
    patch = 0;
  } else if (options.minor) {
    minor++;
    patch = 0;
  } else if (options.patch) {
    patch++;
  }

  const newVersion = `${major}.${minor}.${patch}`;
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(`Version augmentée à ${newVersion}`);
}

function buildModule(module) {
  // delete all public/js/lib.*.js
  fs.readdirSync("./public/js/").forEach((file) => {
    if (file.startsWith("lib." + module)) {
      fs.unlinkSync("./public/js/" + file);
    }
  });
  return new Promise((resolve, reject) => {
    rollupStream({
      input: "src/js/lib." + module + ".js",
      output: { format: "iife" },
    })
      .on("error", (err) => {
        console.log("Error : " + err.message);
        reject(err);
      })
      .pipe(source("lib." + module + "-" + packageJson.version + ".js"))
      .pipe(buffer())
      .pipe(uglify())
      .pipe(gulp.dest("./public/js/"))
      .on("end", resolve)
      .on("finish", resolve);
  });
}

async function build() {
  for (const module of builds) {
    await buildModule(module);
  }
}

async function minifyCss() {
  builds.map((module) => {
    // delete all src/js/module-xxx.css
    fs.readdirSync("./public/css/").forEach((file) => {
      if (file.startsWith(module)) {
        fs.unlinkSync("./public/css/" + file);
      }
    });
    let listOfCss = ["src/css/" + module + ".css"];
    return gulp
      .src(listOfCss)
      .pipe(cleanCSS())
      .pipe(concat(module + "-" + packageJson.version + ".css"))
      .pipe(gulp.dest("./public/css/"));
  });
}

async function updateVersion() {
  builds.map((module) => {
    let htmlPageName = module + ".html";
    if (module === "mathsmentales") htmlPageName = "index.html";
    const htmlPath = path.join(__dirname, "./src/" + htmlPageName);
    const destPath = path.join(__dirname, "./public/" + htmlPageName);
    const htmlContent = fs.readFileSync(htmlPath, "utf8");
    // js
    const regex = new RegExp("lib\\." + module + "\\.js\\?v=[\\d\\.]+");
    let updatedContent = htmlContent.replace(
      regex,
      `lib.${module}-${packageJson.version}.js`,
    );
    updatedContent = updatedContent.replace("alllibs.js", "alllibs.min.js");
    // css - à mettre à jour pour autres modules
    const regex2 = new RegExp(module + "\\.css");
    updatedContent = updatedContent.replace(
      regex2,
      module + "-" + packageJson.version + ".css",
    );
    console.log(htmlPageName + " mis à jour");
    fs.writeFileSync(destPath, updatedContent, "utf8");
  });
}
// copie src/*.html -> public/ si absent ou modifié, hors test*.html
// et hors pages de module (déjà gérées par updateVersion)
const moduleHtmlPages = new Set(
  builds.map((module) => (module === "mathsmentales" ? "index.html" : module + ".html")),
);

async function copyHtml() {
  fs.readdirSync("./src/").forEach((file) => {
    if (!file.endsWith(".html")) return;
    if (file.startsWith("test")) return;
    if (moduleHtmlPages.has(file)) return;

    const srcPath = path.join(__dirname, "./src/" + file);
    const destPath = path.join(__dirname, "./public/" + file);

    const srcContent = fs.readFileSync(srcPath, "utf8");
    const destContent = fs.existsSync(destPath)
      ? fs.readFileSync(destPath, "utf8")
      : null;

    if (destContent === srcContent) return;

    fs.copyFileSync(srcPath, destPath);
    console.log(file + " copié dans public");
  });
}
gulp.task("copy-html", copyHtml);

// copie récursive src/img -> public/img et
// src/library/illustrations -> public/library/illustrations
// si absent ou modifié
function copyNewOrChangedFiles(srcDir, destDir) {
  fs.readdirSync(srcDir, { withFileTypes: true }).forEach((entry) => {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyNewOrChangedFiles(srcPath, destPath);
      return;
    }
    const srcContent = fs.readFileSync(srcPath);
    const destContent = fs.existsSync(destPath)
      ? fs.readFileSync(destPath)
      : null;
    if (destContent !== null && Buffer.compare(srcContent, destContent) === 0)
      return;

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcPath, destPath);
    console.log(path.join(destDir, entry.name) + " copié");
  });
}

async function copyImages() {
  copyNewOrChangedFiles(
    path.join(__dirname, "src/img"),
    path.join(__dirname, "public/img"),
  );
  copyNewOrChangedFiles(
    path.join(__dirname, "src/library/illustrations"),
    path.join(__dirname, "public/library/illustrations"),
  );
}
gulp.task("copy-images", copyImages);

gulp.task("bump-major", () => bumpVersion({ major: true }));
gulp.task("bump-minor", () => bumpVersion({ minor: true }));
gulp.task("bump-patch", () => bumpVersion({ patch: true }));

// création des modules de minification de js et css indépendants
builds.forEach((module) => {
  gulp.task("minify-js-" + module, () => buildModule(module));
  gulp.task("minify-css-" + module, () => {
    // delete all src/js/module-xxx.css
    fs.readdirSync("./public/css/").forEach((file) => {
      if (file.startsWith(module)) {
        fs.unlinkSync("./public/css/" + file);
      }
    });
    let listOfCss = ["src/css/" + module + ".css"];
    return gulp
      .src(listOfCss)
      .pipe(cleanCSS())
      .pipe(concat(module + "-" + packageJson.version + ".css"))
      .pipe(gulp.dest("./public/css/"));
  });
  gulp.task("update-version-" + module, async () => {
    let htmlPageName = module + ".html";
    if (module === "mathsmentales") htmlPageName = "index.html";
    const htmlPath = path.join(__dirname, "./src/" + htmlPageName);
    const destPath = path.join(__dirname, "./public/" + htmlPageName);
    const htmlContent = fs.readFileSync(htmlPath, "utf8");
    // js
    const regex = new RegExp("lib\\." + module + "\\.js\\?v=[\\d\\.]+");
    let updatedContent = htmlContent.replace(
      regex,
      `lib.${module}-${packageJson.version}.js`,
    );
    updatedContent = updatedContent.replace("alllibs.js", "alllibs.min.js");
    // css - à mettre à jour pour autres modules

    const regex2 = new RegExp(module + "\\.css");
    updatedContent = updatedContent.replace(
      regex2,
      module + "-" + packageJson.version + ".css",
    );

    console.log(htmlPageName + " mis à jour");
    fs.writeFileSync(destPath, updatedContent, "utf8");
  });
  gulp.task(
    "maj-" + module,
    gulp.series(
      "minify-js-" + module,
      "minify-css-" + module,
      "update-version-" + module,
      "copy-html",
      "copy-images",
    ),
  );
});

gulp.task("minify-css", minifyCss);
gulp.task("build", build);
gulp.task("update-version", updateVersion);
gulp.task(
  "default",
  gulp.series(
    "bump-patch",
    "build",
    "minify-css",
    "update-version",
    "copy-html",
    "copy-images",
  ),
);
