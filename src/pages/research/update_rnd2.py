import sys

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 4. Update handleCoInventorChange
old_handle_coinventor_change = """  const handleCoInventorChange = (pos, field, value) => {
    const updated = form.otherInventors.map(a => {
      if (a.inventorPosition === pos) {
        const newA = { ...a, [field]: value };

        if (field === "CoInventorType") {
          if (value === "faculty") {
            newA.studentId = "";
            if (a.CoInventorType === "student") {
              newA.name = "";
              newA.empId = "";
            }
          } else if (value === "student") {
            newA.empId = "";
            newA.affiliationType = "Aditya University";
            newA.affiliation = "Aditya University";
            if (a.CoInventorType === "faculty") {
              newA.name = "";
            }
          }
        }

        if (field === "affiliationType") {
          if (value === "Aditya University") {
            newA.affiliation = "Aditya University";
            newA.name = "";
            newA.empId = "";
            newA.studentId = "";
          } else {
            newA.affiliation = "";
            newA.empId = "";
            newA.name = "";
            newA.studentId = "";
          }
        }
        return newA;
      }
      return a;
    });

    setForm(p => ({ ...p, otherInventors: updated }));

    if (field === "empId" && value.length >= 3) {
      const inventor = updated.find(a => a.inventorPosition === pos);
      if (inventor && inventor.affiliationType === "Aditya University" && inventor.CoInventorType !== "student") {
        fetchCoInventorName(pos, value);
      }
    }
  };"""

new_handle_coinventor_change = """  const handleCoInventorChange = (pos, field, value) => {
    const updated = form.otherInventors.map(a => {
      if (a.inventorPosition === pos) {
        const newA = { ...a, [field]: value };

        if (field === "affiliationType") {
          if (value === "Aditya University") {
            newA.affiliation = "Aditya University";
            newA.name = ""; // clear name so it can be fetched
            newA.empId = "";
          } else {
            newA.affiliation = "";
            newA.empId = "";
            newA.name = "";
          }
        }
        return newA;
      }
      return a;
    });

    setForm(p => ({ ...p, otherInventors: updated }));

    if (field === "empId" && value.length >= 3) {
      const inventor = updated.find(a => a.inventorPosition === pos);
      if (inventor && inventor.affiliationType === "Aditya University") {
        fetchCoInventorName(pos, value);
      }
    }
  };"""

content = content.replace(old_handle_coinventor_change, new_handle_coinventor_change)

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Part 2")
