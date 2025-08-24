import { parseMarkdownText } from './markdown-parser'

// Test cases for markdown parsing
const testCases = [
  "This is **bold text** and this is *italic text*",
  "**PRESCRIPTION ANALYSIS**",
  "1. **Medications Listed:** All prescribed medications with generic names",
  "**ABCIXIMAB:** (Generic name not specified on prescription, requires clarification from the prescribing doctor or pharmacist)",
  "**DOXYLAMINE + PYRIDOXINE + FOLIC ACID:** This is a combination medication",
  "*Important:* Always consult with your doctor",
  "Some `inline code` example",
  "🔬 **LAB RESULTS ANALYSIS**"
]

console.log('Testing markdown parser:')
testCases.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: "${test}"`)
  // In a real test, we would render the JSX and check the output
  // For now, just verify the function doesn't crash
  try {
    const result = parseMarkdownText(test)
    console.log('✅ Parsed successfully')
  } catch (error) {
    console.log('❌ Error:', error)
  }
})

export {}