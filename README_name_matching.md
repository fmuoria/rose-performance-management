# Name Matching Script

This Python script performs fuzzy name matching between Baseline and Endline records in a CSV file, assigning unique auto numbers to matched pairs and unmatched records.

## Features

- **Fuzzy Matching**: Uses rapidfuzz library with token_sort_ratio algorithm
- **Configurable Threshold**: Default 85% similarity threshold for matches
- **Auto Number Assignment**: Assigns same ID to matched pairs, unique IDs to unmatched records
- **Automatic Column Detection**: Intelligently detects name columns in the input data
- **Excel Output**: Produces clean Excel file with all original columns plus auto numbers

## Requirements

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Required packages:
- pandas >= 1.5.0
- rapidfuzz >= 3.0.0  
- openpyxl >= 3.0.0

## Input Format

The input CSV file must have:
- A `Timepoint` column with `Baseline` and `Endline` values
- A column containing names to match (automatically detected)
- Any additional columns will be preserved in the output

Example input structure:
```csv
Timepoint,Name,Age,Location,Program
Baseline,John Smith,25,New York,Program A
Baseline,Mary Johnson,30,California,Program B
Endline,Jon Smith,25,New York,Program A
Endline,Mary Johnston,30,California,Program B
```

## Usage

### Basic Usage
```bash
python name_matching_script.py
```
This looks for `Name matching.csv` in the current directory.

### Specify Input File
```bash
python name_matching_script.py input_file.csv
```

## Output

The script generates:
- Excel file named `Name matching with auto number.xlsx`
- All original columns plus new `auto number` column
- Matched pairs have the same auto number
- Unmatched records get unique auto numbers
- Records sorted by auto number for clarity

## Matching Logic

1. **Separation**: Separates records into Baseline and Endline groups
2. **Fuzzy Matching**: For each Baseline name, finds best Endline match using token_sort_ratio
3. **Threshold Check**: Only considers matches with ≥85% similarity 
4. **ID Assignment**: 
   - Matched pairs get the same auto number
   - Unmatched Baseline records get unique auto numbers
   - Unmatched Endline records get unique auto numbers

## Example Results

```
Match found (score: 94.7): 'John Smith' -> 'Jon Smith' (ID: 1)
Match found (score: 96.0): 'Mary Johnson' -> 'Mary Johnston' (ID: 2)
No match for baseline: 'Michael Brown' (ID: 5)
No match for endline: 'Robert Jones' (ID: 6)

Summary:
- Matched pairs: 2
- Unmatched baseline records: 1  
- Unmatched endline records: 1
```

## Customization

You can modify the script to:
- Change the similarity threshold (default: 85)
- Use different fuzzy matching algorithms
- Adjust column detection logic
- Modify output format

## Troubleshooting

**"Timepoint column not found"**: Ensure your CSV has a column named exactly `Timepoint` with `Baseline` and `Endline` values.

**"Could not detect name column"**: The script looks for columns with names like 'name', 'full_name', etc. You may need to rename your name column or modify the detection logic.

**No matches found**: Check that names exist in both Baseline and Endline groups, and consider lowering the similarity threshold.