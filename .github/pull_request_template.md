## 📝 Description

Brief description of what this PR does and why it's needed.

## 🎯 Related Issue

Fixes #(issue number)

## 📋 Type of Change

Please check the relevant option:

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style/UI update
- [ ] ♻️ Code refactor
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update

## 🧪 Testing Checklist

**All PRs must pass these checks before merge:**

### Smart Contract Tests
- [ ] `cargo test` passes (34 tests)
- [ ] `cargo fmt --check` passes
- [ ] `cargo clippy` shows no warnings
- [ ] Contract builds successfully

### Frontend Tests
- [ ] `npm test` passes
- [ ] `npm run lint` shows no errors
- [ ] `npm run type-check` passes
- [ ] Frontend builds successfully

### Additional Checks
- [ ] No hardcoded secrets or sensitive data
- [ ] Documentation updated if needed
- [ ] No console.log() statements in production code
- [ ] Bundle size hasn't increased significantly

## 📸 Screenshots (if applicable)

Add screenshots to help reviewers understand UI changes.

## 🔍 How to Test

Steps to test this PR:
1.
2.
3.

## ✅ Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## 📝 Additional Notes

Any additional information that reviewers should know.