import React, { useState, useEffect, useRef } from "react";
import { 
    Box, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    CircularProgress, 
    FormHelperText,
    Autocomplete,
    TextField
} from "@mui/material";
import API from "../../api/axios";

/**
 * AcademicHierarchyFilter - A cascading dropdown component for Program -> Department -> Branch
 * 
 * @param {Object} props
 * @param {Function} props.onChange - Callback when any selection changes: ({ program, department, branch }) => {}
 * @param {Object} props.initialValues - Initial selection values
 * @param {Boolean} props.showSearch - Whether to use search-enabled dropdowns (Autocomplete)
 */
const AcademicHierarchyFilter = ({ onChange, initialValues = {}, showSearch = false }) => {
    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [branches, setBranches] = useState([]);

    const [selectedProgram, setSelectedProgram] = useState(initialValues.program || "");
    const [selectedDept, setSelectedDept] = useState(initialValues.department || "");
    const [selectedBranch, setSelectedBranch] = useState(initialValues.branch || "");

    const [loading, setLoading] = useState({
        programs: false,
        departments: false,
        branches: false
    });

    // Store onChange in a ref so it's never a useEffect dependency (avoids infinite loop)
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; });

    // Track previous program value to detect external reset
    const prevInitialProgram = useRef(initialValues.program);

    // Fetch Programs on mount
    useEffect(() => {
        const fetchPrograms = async () => {
            setLoading(prev => ({ ...prev, programs: true }));
            try {
                const res = await API.get("/api/academics/programs?status=true");
                if (res.data.success) {
                    setPrograms(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch programs", error);
            } finally {
                setLoading(prev => ({ ...prev, programs: false }));
            }
        };
        fetchPrograms();
    }, []);

    // Fetch Departments when Program changes
    useEffect(() => {
        if (!selectedProgram) {
            setDepartments([]);
            setSelectedDept("");
            setSelectedBranch("");
            return;
        }

        const fetchDepartments = async () => {
            setLoading(prev => ({ ...prev, departments: true }));
            try {
                const res = await API.get(`/api/academics/departments?programId=${selectedProgram}&status=true`);
                if (res.data.success) {
                    setDepartments(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
            } finally {
                setLoading(prev => ({ ...prev, departments: false }));
            }
        };
        fetchDepartments();
    }, [selectedProgram]);

    // Fetch Branches when Department changes
    useEffect(() => {
        if (!selectedDept || !selectedProgram) {
            setBranches([]);
            setSelectedBranch("");
            return;
        }

        const fetchBranches = async () => {
            setLoading(prev => ({ ...prev, branches: true }));
            try {
                const res = await API.get(`/api/academics/branches?programId=${selectedProgram}&departmentId=${selectedDept}&status=true`);
                if (res.data.success) {
                    setBranches(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch branches", error);
            } finally {
                setLoading(prev => ({ ...prev, branches: false }));
            }
        };
        fetchBranches();
    }, [selectedDept, selectedProgram]);

    // Notify parent — onChange is via ref so it's NOT in deps array (no infinite loop)
    useEffect(() => {
        const programObj = programs.find(p => p._id === selectedProgram);
        const deptObj = departments.find(d => d._id === selectedDept);
        const branchObj = branches.find(b => b._id === selectedBranch);

        if (onChangeRef.current) {
            onChangeRef.current({
                program: selectedProgram,
                programName: programObj?.name || "",
                department: selectedDept,
                departmentName: deptObj?.name || "",
                branch: selectedBranch,
                branchName: branchObj?.name || ""
            });
        }
    }, [selectedProgram, selectedDept, selectedBranch, programs, departments, branches]);

    // Sync internal reset when parent clears initialValues.program (e.g., Reset button)
    useEffect(() => {
        if (initialValues.program === "" && prevInitialProgram.current !== "") {
            setSelectedProgram("");
            setSelectedDept("");
            setSelectedBranch("");
        }
        prevInitialProgram.current = initialValues.program;
    }, [initialValues.program]);

    const renderDropdown = (label, value, options, isLoading, onChangeHandler, disabled = false) => {
        if (showSearch) {
            return (
                <Autocomplete
                    options={options}
                    getOptionLabel={(option) => option.name || ""}
                    value={options.find(o => o._id === value) || null}
                    onChange={(event, newValue) => onChangeHandler(newValue ? newValue._id : "")}
                    disabled={disabled}
                    loading={isLoading}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={label}
                            variant="standard"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <React.Fragment>
                                        {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </React.Fragment>
                                ),
                            }}
                        />
                    )}
                    sx={{ minWidth: 200, flex: 1 }}
                />
            );
        }

        return (
            <FormControl variant="standard" sx={{ minWidth: 200, flex: 1 }} disabled={disabled}>
                <InputLabel>{label}</InputLabel>
                <Select
                    value={value}
                    onChange={(e) => onChangeHandler(e.target.value)}
                    label={label}
                    IconComponent={isLoading ? () => <CircularProgress size={16} sx={{ mr: 1.5 }} /> : undefined}
                >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {options.map(opt => (
                        <MenuItem key={opt._id} value={opt._id}>{opt.name}</MenuItem>
                    ))}
                </Select>
                {options.length === 0 && !isLoading && !disabled && (
                    <FormHelperText>No data available</FormHelperText>
                )}
            </FormControl>
        );
    };

    return (
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", width: "100%" }}>
            {renderDropdown("Program", selectedProgram, programs, loading.programs, (val) => {
                setSelectedProgram(val);
                setSelectedDept("");
                setSelectedBranch("");
            })}

            {selectedProgram && renderDropdown("Department", selectedDept, departments, loading.departments, (val) => {
                setSelectedDept(val);
                setSelectedBranch("");
            }, false)}

            {selectedDept && renderDropdown("Branch", selectedBranch, branches, loading.branches, (val) => {
                setSelectedBranch(val);
            }, false)}
        </Box>
    );
};

export default AcademicHierarchyFilter;
