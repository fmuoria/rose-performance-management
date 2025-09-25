#!/usr/bin/env python3
"""
Name Matching Script with Fuzzy Matching

This script processes a CSV file with Baseline and Endline data, performs fuzzy matching
between names from different timepoints, and assigns unique auto numbers to matched pairs.

Requirements:
- Input CSV file should have a 'Timepoint' column with 'Baseline' and 'Endline' values
- Names to match should be in a column (script will detect common name columns)
- Uses rapidfuzz for fuzzy matching with token_sort_ratio and 85% threshold
- Outputs Excel file with all original columns plus 'auto number' column

Usage:
    python name_matching_script.py [input_file.csv]
    
If no input file is specified, it looks for 'Name matching.csv' in the current directory.
"""

import pandas as pd
import sys
import os
from rapidfuzz import fuzz, process
from typing import Dict, List, Tuple, Optional


class NameMatcher:
    """Handles fuzzy matching between Baseline and Endline names."""
    
    def __init__(self, threshold: int = 85):
        """
        Initialize the NameMatcher.
        
        Args:
            threshold: Minimum similarity score for considering names a match (default: 85)
        """
        self.threshold = threshold
        self.next_auto_number = 1
        self.matches: Dict[int, Tuple[int, int]] = {}  # auto_number -> (baseline_idx, endline_idx)
        
    def find_name_column(self, df: pd.DataFrame) -> str:
        """
        Automatically detect the name column in the DataFrame.
        
        Args:
            df: Input DataFrame
            
        Returns:
            Name of the column containing names
            
        Raises:
            ValueError: If no suitable name column is found
        """
        # Common name column patterns
        name_patterns = ['name', 'full_name', 'fullname', 'participant_name', 
                        'participant', 'person', 'individual', 'client']
        
        # Check for exact matches first
        for col in df.columns:
            if col.lower() in name_patterns:
                return col
                
        # Check for partial matches
        for col in df.columns:
            col_lower = col.lower()
            if any(pattern in col_lower for pattern in name_patterns):
                return col
                
        # If no obvious name column, look for string columns with reasonable data
        string_cols = df.select_dtypes(include=['object']).columns
        for col in string_cols:
            if col.lower() != 'timepoint':
                # Check if this column has name-like data (not empty, reasonable length)
                sample_values = df[col].dropna().head(10)
                if len(sample_values) > 0:
                    avg_length = sample_values.str.len().mean()
                    if 5 <= avg_length <= 100:  # Reasonable name length
                        return col
        
        raise ValueError("Could not automatically detect a name column. Please ensure your CSV has a column with names.")
    
    def perform_fuzzy_matching(self, baseline_df: pd.DataFrame, endline_df: pd.DataFrame, 
                             name_col: str) -> pd.DataFrame:
        """
        Perform fuzzy matching between baseline and endline names.
        
        Args:
            baseline_df: DataFrame with baseline records
            endline_df: DataFrame with endline records  
            name_col: Name of the column containing names to match
            
        Returns:
            Combined DataFrame with auto numbers assigned
        """
        # Create copies to avoid modifying original data
        baseline_copy = baseline_df.copy()
        endline_copy = endline_df.copy()
        
        # Initialize auto number column
        baseline_copy['auto number'] = 0
        endline_copy['auto number'] = 0
        
        # Track which endline records have been matched
        matched_endline_indices = set()
        
        # For each baseline record, find the best endline match
        for baseline_idx, baseline_row in baseline_copy.iterrows():
            baseline_name = str(baseline_row[name_col]).strip()
            
            if not baseline_name or baseline_name.lower() == 'nan':
                continue
                
            best_match = None
            best_score = 0
            best_endline_idx = None
            
            # Find best match in endline data
            for endline_idx, endline_row in endline_copy.iterrows():
                if endline_idx in matched_endline_indices:
                    continue  # Already matched
                    
                endline_name = str(endline_row[name_col]).strip()
                
                if not endline_name or endline_name.lower() == 'nan':
                    continue
                
                # Use token_sort_ratio for fuzzy matching
                score = fuzz.token_sort_ratio(baseline_name, endline_name)
                
                if score >= self.threshold and score > best_score:
                    best_match = endline_name
                    best_score = score
                    best_endline_idx = endline_idx
            
            # Assign auto numbers
            if best_match and best_endline_idx is not None:
                # Found a match - assign same auto number to both
                auto_num = self.next_auto_number
                self.next_auto_number += 1
                
                baseline_copy.loc[baseline_idx, 'auto number'] = auto_num
                endline_copy.loc[best_endline_idx, 'auto number'] = auto_num
                
                matched_endline_indices.add(best_endline_idx)
                
                print(f"Match found (score: {best_score}): '{baseline_name}' -> '{best_match}' (ID: {auto_num})")
            else:
                # No match found - assign unique auto number to baseline record
                auto_num = self.next_auto_number
                self.next_auto_number += 1
                baseline_copy.loc[baseline_idx, 'auto number'] = auto_num
                
                print(f"No match for baseline: '{baseline_name}' (ID: {auto_num})")
        
        # Assign unique auto numbers to unmatched endline records
        for endline_idx, endline_row in endline_copy.iterrows():
            if endline_idx not in matched_endline_indices:
                auto_num = self.next_auto_number
                self.next_auto_number += 1
                endline_copy.loc[endline_idx, 'auto number'] = auto_num
                
                endline_name = str(endline_row[name_col]).strip()
                print(f"No match for endline: '{endline_name}' (ID: {auto_num})")
        
        # Combine the dataframes
        result_df = pd.concat([baseline_copy, endline_copy], ignore_index=True)
        
        # Sort by auto number for better readability
        result_df = result_df.sort_values('auto number').reset_index(drop=True)
        
        return result_df


def main():
    """Main function to run the name matching script."""
    
    # Determine input file
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = 'Name matching.csv'
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        print("Please ensure the file exists or specify the correct path.")
        sys.exit(1)
    
    print(f"Processing file: {input_file}")
    
    try:
        # Read the CSV file
        df = pd.read_csv(input_file)
        print(f"Loaded {len(df)} records from {input_file}")
        print(f"Columns: {list(df.columns)}")
        
        # Check for required Timepoint column
        if 'Timepoint' not in df.columns:
            print("Error: 'Timepoint' column not found in the CSV file.")
            print("Available columns:", list(df.columns))
            sys.exit(1)
        
        # Check timepoint values
        timepoint_values = df['Timepoint'].value_counts()
        print(f"Timepoint distribution: {dict(timepoint_values)}")
        
        if 'Baseline' not in timepoint_values or 'Endline' not in timepoint_values:
            print("Warning: Expected 'Baseline' and 'Endline' values in Timepoint column.")
            print("Found values:", list(timepoint_values.index))
        
        # Separate baseline and endline data
        baseline_df = df[df['Timepoint'] == 'Baseline'].copy()
        endline_df = df[df['Timepoint'] == 'Endline'].copy()
        
        print(f"Baseline records: {len(baseline_df)}")
        print(f"Endline records: {len(endline_df)}")
        
        if len(baseline_df) == 0 or len(endline_df) == 0:
            print("Error: Need both Baseline and Endline records to perform matching.")
            sys.exit(1)
        
        # Initialize name matcher
        matcher = NameMatcher(threshold=85)
        
        # Detect name column
        name_col = matcher.find_name_column(df)
        print(f"Using column '{name_col}' for name matching")
        
        # Perform fuzzy matching
        print("\nPerforming fuzzy matching...")
        result_df = matcher.perform_fuzzy_matching(baseline_df, endline_df, name_col)
        
        # Generate output filename
        output_file = 'Name matching with auto number.xlsx'
        
        # Save to Excel
        result_df.to_excel(output_file, index=False)
        
        print(f"\nResults saved to: {output_file}")
        print(f"Total records processed: {len(result_df)}")
        print(f"Unique auto numbers assigned: {matcher.next_auto_number - 1}")
        
        # Summary statistics
        matched_pairs = len(result_df[result_df.duplicated(subset=['auto number'], keep=False)]) // 2
        unmatched_baseline = len(result_df[(result_df['Timepoint'] == 'Baseline') & 
                                         (~result_df.duplicated(subset=['auto number'], keep=False))])
        unmatched_endline = len(result_df[(result_df['Timepoint'] == 'Endline') & 
                                        (~result_df.duplicated(subset=['auto number'], keep=False))])
        
        print(f"\nSummary:")
        print(f"- Matched pairs: {matched_pairs}")
        print(f"- Unmatched baseline records: {unmatched_baseline}")
        print(f"- Unmatched endline records: {unmatched_endline}")
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()