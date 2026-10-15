#!/usr/bin/perl
# Serveur web local pour utiliser MathsMentales sans connexion internet (macOS, Linux).
# Uniquement des modules Perl standard : rien à installer.
#
# Usage : perl hors-ligne/serveur.pl [--no-open] [port]
#
# - n'écoute que sur 127.0.0.1 : inaccessible depuis le réseau ;
# - sert le dossier MathsMentales tel quel et ouvre src/index.html, comme
#   le faisait l'ancien lanceur public/startMM.cmd : sur 127.0.0.1, le code
#   de MathsMentales va chercher les activités dans ../public/library ;
# - port 1180 par défaut, comme l'ancien lanceur : l'historique enregistré
#   par le navigateur est retrouvé d'une fois sur l'autre.
use strict;
use warnings;
use IO::Socket::INET;
use File::Basename qw(dirname);
use Cwd qw(abs_path);

$| = 1;  # messages affichés immédiatement

my $open_browser = 1;
my @args = grep { $_ eq '--no-open' ? do { $open_browser = 0; 0 } : 1 } @ARGV;
my $port = $args[0] || 1180;

my $base = dirname(dirname(abs_path($0)));
my $start = '/src/index.html';

my %types = (
    html => 'text/html; charset=utf-8', htm => 'text/html; charset=utf-8',
    js => 'text/javascript; charset=utf-8', mjs => 'text/javascript; charset=utf-8',
    css => 'text/css; charset=utf-8', json => 'application/json; charset=utf-8',
    webmanifest => 'application/manifest+json', map => 'application/json',
    txt => 'text/plain; charset=utf-8', md => 'text/plain; charset=utf-8',
    yaml => 'text/yaml; charset=utf-8', yml => 'text/yaml; charset=utf-8',
    xml => 'application/xml', svg => 'image/svg+xml', png => 'image/png',
    jpg => 'image/jpeg', jpeg => 'image/jpeg', gif => 'image/gif', webp => 'image/webp',
    ico => 'image/x-icon', woff => 'font/woff', woff2 => 'font/woff2', ttf => 'font/ttf',
    otf => 'font/otf', eot => 'application/vnd.ms-fontobject', mp3 => 'audio/mpeg',
    ogg => 'audio/ogg', wav => 'audio/wav', mp4 => 'video/mp4', pdf => 'application/pdf',
    zip => 'application/zip', odt => 'application/vnd.oasis.opendocument.text',
    wasm => 'application/wasm',
);

# Premier port libre à partir de $port (l'historique reste lié au port 1180).
my $server;
for my $p ($port .. $port + 19) {
    $server = IO::Socket::INET->new(
        LocalAddr => '127.0.0.1', LocalPort => $p, Proto => 'tcp',
        Listen => 64, ReuseAddr => 1,
    ) and do { $port = $p; last };
}
die "Impossible de démarrer : aucun port libre entre $port et " . ($port + 19) . ".\n" unless $server;

my $url = "http://127.0.0.1:$port$start";
print "\nMathsMentales fonctionne sans internet à l'adresse : $url\n";
print "(Port $port : l'historique des diaporamas est lié à ce port.)\n" if $port != ($args[0] || 1180);
print "Laissez cette fenêtre ouverte pendant l'utilisation.\n";
print "Pour arrêter MathsMentales : fermez cette fenêtre (ou Ctrl+C).\n\n";

if ($open_browser) {
    if ($^O eq 'darwin') { system('open', $url) }
    elsif ($^O eq 'linux') { system("xdg-open '$url' >/dev/null 2>&1 &") }
}

$SIG{CHLD} = 'IGNORE';  # pas de processus zombies
$SIG{PIPE} = 'IGNORE';  # navigateur qui ferme la connexion en cours d'envoi

while (my $client = $server->accept) {
    my $pid = fork;
    if (!defined $pid) { handle($client); close $client; next }
    if ($pid) { close $client; next }
    close $server;
    handle($client);
    close $client;
    exit 0;
}

sub reply {
    my ($c, $status, $type, $body, $head) = @_;
    print $c "HTTP/1.1 $status\r\nContent-Type: $type\r\nContent-Length: " . length($body)
      . "\r\nCache-Control: no-cache\r\nConnection: close\r\n\r\n";
    print $c $body unless $head;
}

sub handle {
    my ($c) = @_;
    binmode $c;
    local $SIG{ALRM} = sub { die "délai\n" };
    my $line = eval { alarm 15; my $l = <$c>; alarm 0; $l };
    return unless defined $line;
    # On lit (et ignore) les en-têtes.
    eval { alarm 15; while (my $h = <$c>) { last if $h =~ /^\r?\n$/ } alarm 0; };
    my ($method, $target) = $line =~ m{^(\w+)\s+(\S+)\s+HTTP/} or return reply($c, '400 Bad Request', 'text/plain', "Requête invalide\n");
    return reply($c, '405 Method Not Allowed', 'text/plain', "Méthode non autorisée\n")
      unless $method eq 'GET' || $method eq 'HEAD';
    my $head = $method eq 'HEAD';

    my $path = $target;
    $path =~ s/[?#].*//s;
    $path =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;
    my @parts = grep { length && $_ ne '.' } split m{/}, $path;
    return reply($c, '403 Forbidden', 'text/plain; charset=utf-8', "Accès refusé\n", $head) if grep { $_ eq '..' } @parts;
    my $rel = join '/', @parts;

    # Adresse racine : redirection vers la page d'accueil de MathsMentales.
    unless (length $rel) {
        print $c "HTTP/1.1 302 Found\r\nLocation: $start\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
        return;
    }
    my $file = "$base/$rel";
    $file .= '/index.html' if -d $file;
    if (-f $file && -r _ && open(my $fh, '<:raw', $file)) {
        my ($ext) = $file =~ /\.([^.\/]+)$/;
        my $type = $types{lc($ext // '')} // 'application/octet-stream';
        my $size = -s $fh;
        print $c "HTTP/1.1 200 OK\r\nContent-Type: $type\r\nContent-Length: $size\r\n"
          . "Cache-Control: no-cache\r\nConnection: close\r\n\r\n";
        unless ($head) { local $/ = \65536; while (my $chunk = <$fh>) { print $c $chunk } }
        close $fh;
        return;
    }
    reply($c, '404 Not Found', 'text/plain; charset=utf-8', "Fichier introuvable : /$rel\n", $head);
}
