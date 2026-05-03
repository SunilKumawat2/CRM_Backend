const calculateSalary = (summary, staff, policy) => {
  const perDay =
    staff.salary / (policy.workingDaysPerMonth || 26);

  // ✅ payable days only
  const payableDays =
    (summary.present || 0) +
    (policy.allowHalfDaySalary ? (summary.halfDay || 0) * 0.5 : 0) +
    (summary.leave || 0);

  const baseSalary = payableDays * perDay;

  // ✅ overtime (including weekly off work)
  const overtimePay =
    (summary.overtimeMinutes || 0) *
    (policy.overtimeRatePerMinute || 0);

  const pfDeduction = (baseSalary * policy.pfPercentage) / 100;
  const esiDeduction = (baseSalary * policy.esiPercentage) / 100;

  const finalSalary =
    baseSalary +
    overtimePay -
    (pfDeduction + esiDeduction);

  return {
    perDaySalary: Math.round(perDay),
    baseSalary: Math.round(baseSalary),
    overtimePay: Math.round(overtimePay),
    pfDeduction: Math.round(pfDeduction),
    esiDeduction: Math.round(esiDeduction),
    absentDeduction: 0, // ❌ no double deduction
    finalSalary: Math.round(finalSalary),
  };
};

module.exports = calculateSalary;