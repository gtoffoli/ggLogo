# --- CONFIGURAZIONE ---
$sourceFolder = "\FluidR3_GM"
$fileListPath = "\ggLogo\public\listasounds.txt"
$destinationFolder = "C:\sounds"

# --- ESECUZIONE ---
# Legge la lista dei file consentiti
$allowedFiles = Get-Content -Path $fileListPath
Write-Host $allowedFiles

# Ottiene tutti i file al terzo livello di profondità (Folder\Sub1\File)
# Utilizziamo -Depth 3 per limitare la ricerca, o regoliamo con Get-ChildItem
$allFiles = Get-ChildItem -Path $sourceFolder -Recurse -File

foreach ($file in $allFiles) {
    # Verifica se il file è al terzo livello (percorso contiene almeno 3 sottocartelle rispetto alla radice)
    # $relativeFolder = $file.DirectoryName.Substring($sourceFolder.Length)
    $relativeFolder = $file.DirectoryName
	Write-Host $relativeFolder
    $depth = ($relativeFolder -split '\\' | Where-Object { $_ -ne '' }).Count
    
    if ($depth -eq 3 -and $allowedFiles -contains $file.Name) {
        # Crea la cartella di destinazione speculare
        # $targetPath = Join-Path -Path $destinationFolder -ChildPath $relativeFolder
		$lastSegment = Split-Path -Path $relativeFolder -Leaf
        $targetPath = Join-Path -Path $destinationFolder -ChildPath $lastSegment
        if (!(Test-Path -Path $targetPath)) {
            New-Item -ItemType Directory -Path $targetPath -Force
            Write-Host "Creato folder: $targetPath" -ForegroundColor Yellow
        }
        
        # Copia il file
        Copy-Item -Path $file.FullName -Destination $targetPath -Force
        Write-Host "Copiato: $($file.Name) in $targetPath" -ForegroundColor Green
    }
}
Write-Host "Operazione completata."
