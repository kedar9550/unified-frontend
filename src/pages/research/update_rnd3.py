import sys

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 5. Remove handleStudentsInvolvedChange
old_student_involved = """  const handleStudentsInvolvedChange = (e) => {
    const val = e.target.value;
    setForm((prev) => {
      let newForm = { ...prev, isStudentsInvolved: val };

      if (val === "Yes") {
        newForm.applyIncentive = "No";
      } else {
        newForm.applyIncentive = "";
        if (newForm.otherInventors) {
          newForm.otherInventors = newForm.otherInventors.map(inventor => {
            const newInventor = { ...inventor };
            delete newInventor.CoInventorType;
            delete newInventor.studentId;
            if (inventor.CoInventorType === "student" && newInventor.affiliationType === "Aditya University") {
              newInventor.affiliationType = "";
              newInventor.affiliation = "";
            }
            return newInventor;
          });
        }
      }
      return newForm;
    });
  };"""

content = content.replace(old_student_involved, "")

# 6. Update handleSubmit coInventorsList mapping
old_co_inventors_list = """      const coInventorsList = form.otherInventors.map(a => ({
        name: a.name || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliation || ""),
        employeeId: (a.affiliationType === "Aditya University" && a.CoInventorType !== "student") ? a.empId : null,
        studentId: (a.affiliationType === "Aditya University" && a.CoInventorType === "student") ? a.studentId : null,
        CoInventorType: form.isStudentsInvolved === "Yes" ? (a.CoInventorType || "faculty") : "faculty",
        inventorPosition: a.inventorPosition
      })).filter(ca => ca.name && ca.affiliation);"""

new_co_inventors_list = """      const coInventorsList = form.otherInventors.map(a => ({
        name: a.name || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliation || ""),
        employeeId: a.affiliationType === "Aditya University" ? a.empId : null,
        inventorPosition: a.inventorPosition
      })).filter(ca => ca.name && ca.affiliation);"""

content = content.replace(old_co_inventors_list, new_co_inventors_list)

# 7. Update handleSubmit appends (remove isStudentsInvolved, add totalInventors logic correctly)
old_fd_appends = """      fd.append("coInventors", JSON.stringify(coInventorsList));
      fd.append("isStudentsInvolved", form.isStudentsInvolved || "No");
      fd.append("isInstitutionRecord", form.isInstitutionRecord || "No");
      fd.append("applyIncentive", form.applyIncentive);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("appraisalEligible", form.appraisalEligible || "Yes");
      fd.append("approvedAmount", form.approvedAmount || "");
      fd.append("totalInventors", String(form.totalInventors));"""

new_fd_appends = """      fd.append("coInventors", JSON.stringify(coInventorsList));
      fd.append("isInstitutionRecord", form.isInstitutionRecord || "No");
      fd.append("applyIncentive", form.applyIncentive);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("appraisalEligible", form.appraisalEligible || "Yes");
      fd.append("approvedAmount", form.approvedAmount || "");
      
      const total = form.otherInventors.length + 1;
      fd.append("totalInventors", String(total));

      let expectedAmt = form.status === "Published" ? 5000 : (form.status === "Granted" ? 15000 : 0);
      if (form.applyingSeedGrant === "Yes") expectedAmt = expectedAmt / 2;

      fd.append("publishedstatus", form.status === "Published" ? "yes" : "no");
      fd.append("publishedexpectedamount", (form.applyIncentive === "Yes" && form.status === "Published") ? expectedAmt : "");
      
      fd.append("grantedstatus", form.status === "Granted" ? "yes" : "no");
      fd.append("grantedexpectedamount", (form.applyIncentive === "Yes" && form.status === "Granted") ? expectedAmt : "");
"""
content = content.replace(old_fd_appends, new_fd_appends)

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Part 3")
