<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Config
$defaultLookbackSeconds = 60; // last 1 minute

// Inputs
$dirInput = isset($_GET['dir']) ? trim((string)$_GET['dir']) : '.';
$secondsInput = isset($_GET['seconds']) ? (int)$_GET['seconds'] : $defaultLookbackSeconds;
$download = isset($_GET['download']) && $_GET['download'] === 'true';

if ($secondsInput <= 0) {
    $secondsInput = $defaultLookbackSeconds;
}

// Resolve directory safely
$baseDir = realpath($dirInput !== '' ? $dirInput : '.');
if ($baseDir === false || !is_dir($baseDir)) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => 'Invalid directory',
        'dir' => $dirInput,
    ], JSON_PRETTY_PRINT);
    exit;
}

$thresholdTs = time() - $secondsInput;
$results = [];

try {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($baseDir, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $fileInfo) {
        if (!$fileInfo->isFile()) {
            continue;
        }

        $filePath = $fileInfo->getPathname();
        $fileName = $fileInfo->getFilename();
        
        // Skip index.php files
        if (strtolower($fileName) === 'index.php') {
            continue;
        }
        
        // Process all file types (removed PHP-only restriction)
        // Skip certain file types that shouldn't be synced
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $skipExtensions = ['tmp', 'log', 'bak', 'swp', '~'];
        if (in_array($extension, $skipExtensions)) {
            continue;
        }
        
        // Only process files under www* folders
        $relativePath = str_replace($baseDir . DIRECTORY_SEPARATOR, '', $filePath);
        $pathParts = explode(DIRECTORY_SEPARATOR, $relativePath);
        $hasWwwFolder = false;
        
        foreach ($pathParts as $part) {
            if (strpos(strtolower($part), 'www') === 0) {
                $hasWwwFolder = true;
                break;
            }
        }
        
        if (!$hasWwwFolder) {
            continue;
        }

        $mtime = $fileInfo->getMTime();
        if ($mtime >= $thresholdTs) {
            $results[] = [
                'path' => $filePath,
                'mtime' => $mtime,
                'mtime_iso' => date('c', $mtime),
                'size' => $fileInfo->getSize(),
            ];
        }
    }

    // Sort newest first
    usort($results, function ($a, $b) {
        return $b['mtime'] <=> $a['mtime'];
    });

    $response = [
        'ok' => true,
        'dir' => $baseDir,
        'lookback_seconds' => $secondsInput,
        'count' => count($results),
        'files' => $results,
        'filters' => [
            'exclude_index_php' => true,
            'all_file_types' => true,
            'exclude_temp_files' => true,
            'only_www_folders' => true
        ]
    ];

    if (count($results) > 0) {
        if (!class_exists('ZipArchive')) {
            // ZipArchive not available
            if ($download) {
                http_response_code(500);
                echo json_encode([
                    'ok' => false,
                    'error' => 'ZipArchive extension is not available to create zip files'
                ], JSON_PRETTY_PRINT);
                exit;
            } else {
                $response['ok'] = false;
                $response['error'] = 'ZipArchive extension is not available to create zip files';
            }
        } else {
            $zipFilename = 'changed_files_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.zip';
            $zipPath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $zipFilename;

            $zip = new ZipArchive();
            $opened = $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
            if ($opened !== true) {
                if ($download) {
                    http_response_code(500);
                    echo json_encode([
                        'ok' => false,
                        'error' => 'Failed to create zip file'
                    ], JSON_PRETTY_PRINT);
                    exit;
                } else {
                    $response['ok'] = false;
                    $response['error'] = 'Failed to create zip file';
                }
            } else {
                foreach ($results as $file) {
                    $absolutePath = $file['path'];
                    // Determine relative path within the zip
                    $relativePath = $absolutePath;
                    $prefix = rtrim($baseDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
                    if (strpos($absolutePath, $prefix) === 0) {
                        $relativePath = substr($absolutePath, strlen($prefix));
                    } else {
                        $relativePath = basename($absolutePath);
                    }
                    $zip->addFile($absolutePath, $relativePath);
                }
                $zip->close();
                
                if ($download) {
                    // Return the ZIP file directly
                    header('Content-Type: application/zip');
                    header('Content-Disposition: attachment; filename="' . $zipFilename . '"');
                    header('Content-Length: ' . filesize($zipPath));
                    header('Cache-Control: no-cache, must-revalidate');
                    header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
                    
                    readfile($zipPath);
                    unlink($zipPath); // Clean up temp file
                    exit;
                } else {
                    // Return JSON with zip info
                    $response['zip_path'] = $zipPath;
                    $response['zip_size'] = @filesize($zipPath) ?: null;
                }
            }
        }
    } else if ($download) {
        // No files found but download was requested
        http_response_code(404);
        echo json_encode([
            'ok' => false,
            'error' => 'No files found to download',
            'count' => 0
        ], JSON_PRETTY_PRINT);
        exit;
    }

    echo json_encode($response, JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Unexpected error',
        'message' => $e->getMessage(),
    ], JSON_PRETTY_PRINT);
}


