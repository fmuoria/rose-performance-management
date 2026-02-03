/**
 * Unit Tests for ROSE Performance Management System
 * Tests for validation, formatting, and calculation functions
 */

// Test framework
const TestRunner = {
  results: [],
  suites: [],
  
  /**
   * Create a test suite
   * @param {string} name - Suite name
   * @param {Function} fn - Suite function containing tests
   */
  describe(name, fn) {
    const suite = {
      name: name,
      tests: []
    };
    this.currentSuite = suite;
    this.suites.push(suite);
    fn();
    this.currentSuite = null;
  },
  
  /**
   * Define a test case
   * @param {string} description - Test description
   * @param {Function} fn - Test function
   */
  it(description, fn) {
    if (!this.currentSuite) {
      console.error('Test must be inside a describe block');
      return;
    }
    
    this.currentSuite.tests.push({
      description: description,
      fn: fn
    });
  },
  
  /**
   * Run all test suites
   */
  runAll() {
    this.results = [];
    const startTime = performance.now();
    
    this.suites.forEach(suite => {
      suite.tests.forEach(test => {
        try {
          test.fn();
          this.results.push({
            suite: suite.name,
            test: test.description,
            passed: true
          });
        } catch (error) {
          this.results.push({
            suite: suite.name,
            test: test.description,
            passed: false,
            error: error.message
          });
        }
      });
    });
    
    const duration = (performance.now() - startTime).toFixed(2);
    this.displayResults(duration);
    this.logToConsole();
  },
  
  /**
   * Display results in HTML
   */
  displayResults(duration) {
    const container = document.getElementById('testResults');
    const summaryEl = document.getElementById('summary');
    container.innerHTML = '';
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    // Summary
    summaryEl.className = 'summary ' + (failed === 0 ? 'all-pass' : 'some-fail');
    summaryEl.innerHTML = `
      <strong>Test Results:</strong> ${passed}/${total} passed, ${failed} failed
      <br><small>Completed in ${duration}ms</small>
    `;
    
    // Group by suite
    const suiteMap = {};
    this.results.forEach(result => {
      if (!suiteMap[result.suite]) {
        suiteMap[result.suite] = [];
      }
      suiteMap[result.suite].push(result);
    });
    
    // Display each suite
    Object.keys(suiteMap).forEach(suiteName => {
      const suiteDiv = document.createElement('div');
      suiteDiv.className = 'test-suite';
      
      const suiteTitle = document.createElement('h2');
      suiteTitle.textContent = suiteName;
      suiteDiv.appendChild(suiteTitle);
      
      suiteMap[suiteName].forEach(result => {
        const testDiv = document.createElement('div');
        testDiv.className = 'test-result ' + (result.passed ? 'pass' : 'fail');
        testDiv.innerHTML = `
          <strong>${result.passed ? '✓' : '✗'}</strong> ${result.test}
          ${result.error ? '<br><small>Error: ' + result.error + '</small>' : ''}
        `;
        suiteDiv.appendChild(testDiv);
      });
      
      container.appendChild(suiteDiv);
    });
  },
  
  /**
   * Log results to console
   */
  logToConsole() {
    console.group('%c🧪 Test Results', 'font-size: 16px; font-weight: bold;');
    
    this.suites.forEach(suite => {
      console.group(suite.name);
      const suiteResults = this.results.filter(r => r.suite === suite.name);
      suiteResults.forEach(result => {
        if (result.passed) {
          console.log('%c✓ ' + result.test, 'color: green;');
        } else {
          console.error('✗ ' + result.test);
          console.error('  Error: ' + result.error);
        }
      });
      console.groupEnd();
    });
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    console.log(`\n${passed}/${this.results.length} tests passed`);
    
    console.groupEnd();
  }
};

// Assertion helpers
function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Got: ${actual}`);
  }
}

function assertTrue(value, message = 'Expected true') {
  if (value !== true) {
    throw new Error(message);
  }
}

function assertFalse(value, message = 'Expected false') {
  if (value !== false) {
    throw new Error(message);
  }
}

/**
 * Assert function throws an error
 * @param {Function} fn - Function that should throw
 * @param {string} message - Error message if doesn't throw
 */
function assertThrows(fn, message = 'Expected function to throw') {
  let didThrow = false;
  try {
    fn();
  } catch (e) {
    didThrow = true;
  }
  
  if (!didThrow) {
    throw new Error(message);
  }
}

// ===== VALIDATION TESTS =====
TestRunner.describe('Validation Functions', () => {
  
  TestRunner.it('should validate correct email format', () => {
    assertTrue(validateEmail('user@example.com'));
    assertTrue(validateEmail('test.user@company.co.uk'));
  });
  
  TestRunner.it('should reject invalid email format', () => {
    assertFalse(validateEmail('notanemail'));
    assertFalse(validateEmail('@example.com'));
    assertFalse(validateEmail('user@'));
    assertFalse(validateEmail(''));
    assertFalse(validateEmail(null));
  });
  
  TestRunner.it('should validate number range correctly', () => {
    assertTrue(validateNumberRange(50, 0, 100));
    assertTrue(validateNumberRange(0, 0, 100));
    assertTrue(validateNumberRange(100, 0, 100));
  });
  
  TestRunner.it('should reject numbers outside range', () => {
    assertFalse(validateNumberRange(-1, 0, 100));
    assertFalse(validateNumberRange(101, 0, 100));
    assertFalse(validateNumberRange('not a number', 0, 100));
  });
  
  TestRunner.it('should validate string length correctly', () => {
    assertTrue(validateStringLength('hello', 10, 1));
    assertTrue(validateStringLength('test', 4, 4));
  });
  
  TestRunner.it('should reject strings with invalid length', () => {
    assertFalse(validateStringLength('', 10, 1));
    assertFalse(validateStringLength('toolongstring', 5, 1));
    assertFalse(validateStringLength(123, 10, 1)); // Not a string
  });
  
  TestRunner.it('should validate weight percentage (0-100)', () => {
    assertTrue(validateWeight(0));
    assertTrue(validateWeight(50));
    assertTrue(validateWeight(100));
  });
  
  TestRunner.it('should reject invalid weight values', () => {
    assertFalse(validateWeight(-1));
    assertFalse(validateWeight(101));
  });
  
  TestRunner.it('should validate weights sum to 100', () => {
    assertTrue(validateWeightsSum([25, 25, 25, 25]));
    assertTrue(validateWeightsSum([10, 30, 60]));
  });
  
  TestRunner.it('should reject weights that do not sum to 100', () => {
    assertFalse(validateWeightsSum([25, 25, 25])); // 75
    assertFalse(validateWeightsSum([50, 60])); // 110
    assertFalse(validateWeightsSum([]));
  });
  
  TestRunner.it('should validate required fields', () => {
    assertTrue(validateRequired('value'));
    assertTrue(validateRequired(123));
    assertTrue(validateRequired(true));
  });
  
  TestRunner.it('should reject empty required fields', () => {
    assertFalse(validateRequired(''));
    assertFalse(validateRequired('   ')); // Whitespace only
    assertFalse(validateRequired(null));
    assertFalse(validateRequired(undefined));
  });
  
  TestRunner.it('should sanitize HTML input', () => {
    assertEqual(sanitizeInput('<script>alert("xss")</script>'), '&lt;script&gt;alert("xss")&lt;/script&gt;');
    assertEqual(sanitizeInput('<b>Bold</b>'), '&lt;b&gt;Bold&lt;/b&gt;');
    assertEqual(sanitizeInput('Normal text'), 'Normal text');
  });
});

// ===== FORMATTING TESTS =====
TestRunner.describe('Formatting Functions', () => {
  
  TestRunner.it('should format currency correctly', () => {
    assertEqual(formatCurrency(1000), 'KES 1,000.00');
    assertEqual(formatCurrency(1000000), 'KES 1,000,000.00');
  });
  
  TestRunner.it('should format percentage correctly', () => {
    assertEqual(formatPercentage(50), '50.0%');
    assertEqual(formatPercentage(33.333, 2), '33.33%');
  });
  
  TestRunner.it('should truncate text correctly', () => {
    assertEqual(truncateText('This is a long text', 10), 'This is...');
    assertEqual(truncateText('Short', 10), 'Short');
  });
  
  TestRunner.it('should escape HTML correctly', () => {
    assertEqual(escapeHtml('<div>Test</div>'), '&lt;div&gt;Test&lt;/div&gt;');
    assertEqual(escapeHtml('A & B'), 'A &amp; B');
    assertEqual(escapeHtml('"quoted"'), '&quot;quoted&quot;');
  });
});

// ===== CONFIG TESTS =====
TestRunner.describe('Configuration', () => {
  
  TestRunner.it('should have CONFIG object defined', () => {
    assertTrue(typeof CONFIG !== 'undefined');
  });
  
  TestRunner.it('should have updated polling interval to 2 minutes', () => {
    assertEqual(CONFIG.POLLING_INTERVAL, 120000);
  });
  
  TestRunner.it('should have scorecard dimensions defined', () => {
    assertTrue(Array.isArray(SCORECARD_DIMENSIONS));
    assertTrue(SCORECARD_DIMENSIONS.length === 4);
  });
  
  TestRunner.it('should have proper scorecard dimension structure', () => {
    SCORECARD_DIMENSIONS.forEach(dim => {
      assertTrue('dimension' in dim);
      assertTrue('measures' in dim);
      assertTrue(Array.isArray(dim.measures));
    });
  });
});

// ===== API HELPERS TESTS =====
TestRunner.describe('API Helper Functions', () => {
  
  TestRunner.it('should build API URL correctly', () => {
    const url = buildApiUrl('https://example.com/api', {
      action: 'test',
      email: 'user@example.com'
    });
    assertTrue(url.includes('action=test'));
    assertTrue(url.includes('email=user%40example.com'));
  });
  
  TestRunner.it('should handle empty params', () => {
    const url = buildApiUrl('https://example.com/api', {});
    assertEqual(url, 'https://example.com/api?');
  });
});

// ===== AUTH TESTS =====
TestRunner.describe('Authentication Functions', () => {
  
  TestRunner.it('should parse JWT token correctly', () => {
    // Sample JWT token (header.payload.signature)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const decoded = parseJwt(token);
    assertEqual(decoded.name, 'John Doe');
    assertEqual(decoded.sub, '1234567890');
  });
});

// Global test functions
function runAllTests() {
  TestRunner.runAll();
}

function clearResults() {
  document.getElementById('testResults').innerHTML = '';
  document.getElementById('summary').innerHTML = '';
  TestRunner.results = [];
}

// Make test runner available globally
window.TestRunner = TestRunner;
window.runAllTests = runAllTests;
window.clearResults = clearResults;

console.log('%c✅ Test suite loaded successfully', 'color: green; font-weight: bold;');
console.log('%cCall runAllTests() to run all tests', 'color: #666;');
