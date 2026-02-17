param(
  [string]$IP = "192.168.200.103",
  [int]$Days = 365,
  [string]$KeyPath = "certs/dev-key.pem",
  [string]$CertPath = "certs/dev-cert.pem"
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if (!(Test-Path -Path "certs")) { New-Item -ItemType Directory -Path "certs" | Out-Null }
$conf = @"
[ req ]
default_bits = 2048
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no
[ req_distinguished_name ]
CN = localhost
[ v3_req ]
subjectAltName = @alt_names
[ alt_names ]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = $IP
"@
Set-Content -Path "certs/openssl-local.cnf" -Value $conf -Encoding UTF8
& openssl genrsa -out $KeyPath 2048
& openssl req -new -x509 -key $KeyPath -out $CertPath -days $Days -sha256 -config "certs/openssl-local.cnf" -extensions v3_req
Write-Output "OK $KeyPath"
Write-Output "OK $CertPath"
