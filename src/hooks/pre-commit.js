/**
 * Pre-commit hook - 提交前自动代码审查
 * 集成到 Git Hook 后，每次 commit 自动触发
 */
module.exports = async function preCommitReview() {
  // TODO: 获取 staged 文件变更
  // TODO: 调用 AI 进行代码审查
  // TODO: 输出审查结果
  console.log('🔍 Pre-commit: AI code review triggered');
};
