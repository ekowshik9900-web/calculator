/**
 * ==============================================================================
 * MODERN MINIMALIST CALCULATOR - JAVASCRIPT LOGIC
 * ==============================================================================
 * This script powers all calculator operations:
 * 1. State Management (tracking numbers, current operator, and reset flags)
 * 2. Input Handling (numbers, decimal point, operators)
 * 3. Arithmetic Computation (+, −, ×, ÷, %, +/-) with floating-point safety
 * 4. Display Formatting (localized comma separators, dynamic AC/C label)
 * 5. Event Listeners (Mouse clicks & full Physical Keyboard support)
 * ==============================================================================
 */

// ---------------------------------------------------------------------------
// 1. DOM ELEMENT REFERENCES
// ---------------------------------------------------------------------------
// We query the HTML elements that display data or listen for user actions.
const previousOperandElement = document.getElementById('previousOperand');
const currentOperandElement = document.getElementById('currentOperand');
const clearButton = document.getElementById('clearBtn');
const keypad = document.querySelector('.keypad');

// ---------------------------------------------------------------------------
// 2. STATE VARIABLES
// ---------------------------------------------------------------------------
// These variables store the internal state of our calculator.
let currentOperand = '0';       // The number currently being typed or the latest result
let previousOperand = '';      // The number stored before an operator was selected
let activeOperation = null;    // The pending mathematical operator ('+', '−', '×', '÷')
let shouldResetScreen = false; // Flag to overwrite display when typing a new number after an operator or '='

// ---------------------------------------------------------------------------
// 3. CORE LOGIC FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Resets all calculator values back to their starting default state.
 */
function clearAll() {
  currentOperand = '0';
  previousOperand = '';
  activeOperation = null;
  shouldResetScreen = false;
  updateDisplay();
}

/**
 * Appends a digit (0-9) or decimal point (.) to the current operand.
 * @param {string} number - The digit or decimal string to append
 */
function appendNumber(number) {
  // If the user previously hit an operator or '=', start fresh with the new digit
  if (shouldResetScreen) {
    currentOperand = '';
    shouldResetScreen = false;
  }

  // Prevent multiple decimal points (e.g., prevent "3.14.5")
  if (number === '.' && currentOperand.includes('.')) {
    return;
  }

  // Prevent leading zeros from stacking (e.g., pressing "0" multiple times when at "0")
  if (currentOperand === '0' && number !== '.') {
    currentOperand = number;
  } else {
    currentOperand += number;
  }

  updateDisplay();
}

/**
 * Handles operator selection (+, −, ×, ÷).
 * If a calculation was already pending, it automatically computes that first (chaining).
 * @param {string} operator - The symbol of the mathematical operation
 */
function chooseOperation(operator) {
  // If the screen currently shows an error, do nothing until AC is clicked
  if (currentOperand === 'Error') return;

  // If the user already chose an operator but hasn't entered a new number yet,
  // simply update the active operator (e.g., pressed '+' then decided to change to '×')
  if (activeOperation !== null && shouldResetScreen) {
    activeOperation = operator;
    updateDisplay();
    return;
  }

  // If there is already a previous operand queued, compute the intermediate result first
  if (previousOperand !== '') {
    compute();
  }

  activeOperation = operator;
  previousOperand = currentOperand;
  shouldResetScreen = true;
  updateDisplay();
}

/**
 * Executes the arithmetic calculation between previousOperand and currentOperand.
 */
function compute() {
  // We need both an operation and a stored previous number to perform math
  if (activeOperation === null || shouldResetScreen) return;

  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);

  // Guard against invalid inputs
  if (isNaN(prev) || isNaN(current)) return;

  let computationResult;

  switch (activeOperation) {
    case '+':
      computationResult = prev + current;
      break;

    case '−':
      computationResult = prev - current;
      break;

    case '×':
      computationResult = prev * current;
      break;

    case '÷':
      // Handle division by zero gracefully
      if (current === 0) {
        currentOperand = 'Error';
        previousOperand = '';
        activeOperation = null;
        shouldResetScreen = true;
        updateDisplay();
        return;
      }
      computationResult = prev / current;
      break;

    default:
      return;
  }

  // Fix JavaScript floating-point inaccuracies (e.g., 0.1 + 0.2 = 0.30000000000000004)
  // by rounding to at most 10 decimal places and trimming trailing zeros.
  currentOperand = roundResult(computationResult).toString();
  activeOperation = null;
  previousOperand = '';
  shouldResetScreen = true;
  updateDisplay();
}

/**
 * Toggles the sign of the current number between positive and negative (+/-).
 */
function toggleSign() {
  if (currentOperand === '0' || currentOperand === 'Error') return;

  // Multiply by -1 and convert back to string
  currentOperand = (parseFloat(currentOperand) * -1).toString();
  updateDisplay();
}

/**
 * Converts the current number into a percentage (divides by 100).
 */
function calculatePercentage() {
  if (currentOperand === 'Error') return;

  const current = parseFloat(currentOperand);
  if (isNaN(current)) return;

  // Unary percentage (iOS behavior): 50% becomes 0.5
  currentOperand = roundResult(current / 100).toString();
  updateDisplay();
}

/**
 * Helper: Rounds numbers to eliminate floating-point precision errors.
 * @param {number} num - The number to round
 * @returns {number} Clean rounded float
 */
function roundResult(num) {
  return Math.round((num + Number.EPSILON) * 1e10) / 1e10;
}

/**
 * Helper: Formats a number string with commas for thousands (e.g. 1,000,000).
 * Preserves in-progress decimal typing like "12."
 * @param {string} numberString - The raw string representation of the number
 * @returns {string} Formatted string with locale commas
 */
function formatDisplayNumber(numberString) {
  if (numberString === 'Error') return 'Error';
  if (!numberString) return '';

  // Split into integer and decimal components
  const parts = numberString.split('.');
  const integerPart = parseFloat(parts[0]);
  const decimalPart = parts[1];

  let formattedInteger = '';
  if (isNaN(integerPart)) {
    formattedInteger = '';
  } else {
    formattedInteger = integerPart.toLocaleString('en-US');
  }

  // If there's a decimal point, reconnect it with the decimal digits
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }
  return formattedInteger;
}

// ---------------------------------------------------------------------------
// 4. DISPLAY REFRESH
// ---------------------------------------------------------------------------
/**
 * Updates both the current and previous display elements in the DOM.
 */
function updateDisplay() {
  // 1. Update the main display
  currentOperandElement.innerText = formatDisplayNumber(currentOperand);

  // 2. Update the upper history line showing previous number & operator
  if (activeOperation !== null && previousOperand !== '') {
    previousOperandElement.innerText = `${formatDisplayNumber(previousOperand)} ${activeOperation}`;
  } else {
    previousOperandElement.innerText = '';
  }

  // 3. Dynamic "AC" vs "C" Button label (like iOS)
  // If the user has typed something other than "0", show "C" (Clear current)
  // When in default state or after compute, show "AC" (All Clear)
  if (currentOperand !== '0' && currentOperand !== 'Error') {
    clearButton.innerText = 'C';
  } else {
    clearButton.innerText = 'AC';
  }

  // 4. Highlight active operator button
  updateActiveOperatorStyles();
}

/**
 * Toggles an active visual highlight on the currently selected operator button.
 */
function updateActiveOperatorStyles() {
  const operatorButtons = document.querySelectorAll('.btn-operator');
  operatorButtons.forEach((btn) => {
    if (activeOperation && btn.getAttribute('data-value') === activeOperation && shouldResetScreen) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  });
}

// ---------------------------------------------------------------------------
// 5. EVENT LISTENERS (CLICK & KEYBOARD)
// ---------------------------------------------------------------------------

// Single Event Delegation listener on the keypad for optimal performance
keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return; // Ignore clicks between buttons

  const action = button.dataset.action;
  const value = button.dataset.value;

  switch (action) {
    case 'number':
      appendNumber(value);
      break;

    case 'operator':
      chooseOperation(value);
      break;

    case 'calculate':
      compute();
      break;

    case 'all-clear':
      clearAll();
      break;

    case 'toggle-sign':
      toggleSign();
      break;

    case 'percent':
      calculatePercentage();
      break;

    default:
      break;
  }
});

// Full Physical Keyboard Support
window.addEventListener('keydown', (event) => {
  const key = event.key;

  // Number Keys 0-9
  if (/^[0-9]$/.test(key)) {
    appendNumber(key);
  }

  // Decimal Point
  else if (key === '.') {
    appendNumber('.');
  }

  // Operators (+, -, *, /)
  else if (key === '+') {
    chooseOperation('+');
  } else if (key === '-') {
    chooseOperation('−');
  } else if (key === '*') {
    chooseOperation('×');
  } else if (key === '/') {
    event.preventDefault(); // Prevent browser quick-find shortcut
    chooseOperation('÷');
  }

  // Percentage (%)
  else if (key === '%') {
    calculatePercentage();
  }

  // Equals / Enter
  else if (key === 'Enter' || key === '=') {
    event.preventDefault();
    compute();
  }

  // Clear / Escape
  else if (key === 'Escape') {
    clearAll();
  }

  // Backspace (Delete last entered digit)
  else if (key === 'Backspace') {
    if (currentOperand !== '0' && currentOperand !== 'Error' && !shouldResetScreen) {
      currentOperand = currentOperand.slice(0, -1);
      if (currentOperand === '' || currentOperand === '-') {
        currentOperand = '0';
      }
      updateDisplay();
    }
  }
});

// Initialize display on page load
clearAll();

