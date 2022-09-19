<?php

// Autoload dependencies
require 'vendor/autoload.php';

// Import the IOFactory class
use \PhpOffice\PhpSpreadsheet\IOFactory;

// Full path of the file to be indentified
$inputFileName = 'create-xlsx-files-with-different-cell-background-colors.xlsx';

// Identify the file type using the IOFactory object
$inputFileType = IOFactory::identify($inputFileName);

// Create the reader object
$reader = IOFactory::createReader($inputFileType);

// Instruct the reader to just read cell data
$reader->setReadDataOnly(true);

// Load the file to read
$spreadsheet = $reader->load($inputFileName);

// Get the active sheet
$sheet = $spreadsheet->getActiveSheet();

/**
 * Get the background color of column A, row 1.
 */
echo $sheet->getStyle('A1')->getFill()->getStartColor()->getRGB();

echo PHP_EOL;

/**
 * Get the background color of column A, row 2.
