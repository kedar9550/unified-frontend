import sys

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update initialFormState
content = content.replace("""    applyingSeedGrant: "No",
    isStudentsInvolved: "No",
    applyIncentive: "",
    totalInventors: 1,""", """    applyingSeedGrant: "No",
    applyIncentive: "",""")

# 2. Update set function (remove isStudentsInvolved)
content = content.replace("""      const newForm = { ...p, [k]: val };
      if (k === "isStudentsInvolved" && val === "Yes") {
        newForm.applyIncentive = "No";
      }
      if (k === "isInstitutionRecord") {""", """      const newForm = { ...p, [k]: val };
      if (k === "isInstitutionRecord") {""")

# 3. Replace useEffect for totalInventors with handleAddInventor / handleRemoveInventor
old_use_effect = """  // Handle dynamic inventor generation based on total inventors
  useEffect(() => {
    let total = parseInt(form.totalInventors);
    if (isNaN(total) || total < 1) {
      total = 1;
      if (form.totalInventors !== "") {
        setForm(p => ({ ...p, totalInventors: 1 }));
      }
    }

    if (total === 1) {
      setForm(p => ({ ...p, otherInventors: [] }));
      return;
    }

    let newOtherInventors = [];
    for (let i = 2; i <= total; i++) {
      const existing = form.otherInventors.find(a => a.inventorPosition === i);
      newOtherInventors.push(existing || {
        inventorPosition: i,
        affiliationType: "Aditya University",
        empId: "",
        name: "",
        affiliation: "Aditya University"
      });
    }
    setForm(p => ({ ...p, otherInventors: newOtherInventors }));
  }, [form.totalInventors]);"""

new_add_remove = """  const handleAddInventor = () => {
    setForm(p => {
      const maxPos = p.otherInventors.length > 0 ? Math.max(...p.otherInventors.map(a => a.inventorPosition)) : 1;
      return {
        ...p,
        otherInventors: [
          ...p.otherInventors,
          {
            inventorPosition: maxPos + 1,
            affiliationType: "",
            empId: "",
            name: "",
            affiliation: ""
          }
        ]
      };
    });
  };

  const handleRemoveInventor = (pos) => {
    setForm(p => ({
      ...p,
      otherInventors: p.otherInventors.filter(a => a.inventorPosition !== pos)
    }));
  };"""

content = content.replace(old_use_effect, new_add_remove)

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Part 1")
