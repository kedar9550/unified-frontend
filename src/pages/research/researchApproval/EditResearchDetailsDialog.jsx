import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Typography,
    IconButton,
    Box,
    Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "sonner";
import API from "../../../api/axios";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - 10 + i));

const EditResearchDetailsDialog = ({ open, onClose, type, currentData, onSave }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentData) {
            setFormData({ ...currentData });
        }
    }, [currentData, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleArrayChange = (field, index, key, value) => {
        setFormData(prev => {
            const newArray = [...(prev[field] || [])];
            newArray[index] = { ...newArray[index], [key]: value };
            return { ...prev, [field]: newArray };
        });
    };

    const addArrayItem = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] || []), {}]
        }));
    };

    const removeArrayItem = (field, index) => {
        setFormData(prev => {
            const newArray = [...(prev[field] || [])];
            newArray.splice(index, 1);
            return { ...prev, [field]: newArray };
        });
    };

    const renderArrayEditor = (field, title, positionKey = null) => {
        const items = formData[field] || [];
        return (
            <Box sx={{ gridColumn: "span 12", mt: 1, p: 2, border: "1px solid var(--border-color)", borderRadius: "12px", bgcolor: "rgba(0,0,0,0.02)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{title}</Typography>
                    <Button size="small" variant="outlined" onClick={() => addArrayItem(field)} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}>Add +</Button>
                </Box>
                {items.length === 0 && <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontStyle: "italic", mb: 1 }}>No {title.toLowerCase()} added.</Typography>}
                {items.map((item, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 1.5, mb: 1.5, alignItems: "flex-start" }}>
                        {positionKey && (
                            <TextField size="small" label="Position" type="number" sx={{ width: 80 }} value={item[positionKey] || ""} onChange={(e) => handleArrayChange(field, index, positionKey, e.target.value)} />
                        )}
                        <TextField size="small" label="Name" sx={{ flex: 1 }} value={item.name || ""} onChange={(e) => handleArrayChange(field, index, 'name', e.target.value)} />
                        <TextField size="small" label="Affiliation" sx={{ flex: 1 }} value={item.affiliation || ""} onChange={(e) => handleArrayChange(field, index, 'affiliation', e.target.value)} />
                        <Button color="error" onClick={() => removeArrayItem(field, index)} sx={{ mt: 0.5, minWidth: 'auto', p: 1, borderRadius: '8px' }}><CloseIcon fontSize="small" /></Button>
                    </Box>
                ))}
            </Box>
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let routeType = type.toLowerCase().replace(/[\s\.]+/g, "-");
            if (routeType === "bookchapter") routeType = "book-chapter";
            if (routeType === "fundedproject") routeType = "funded-project";
            if (routeType === "novelproduct") routeType = "novel-product";

            const res = await API.put(`/api/hod/research-requests/${routeType}/${currentData._id}`, formData);
            if (res.data?.success) {
                toast.success("Research details updated successfully");
                onSave(res.data.data);
                onClose();
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.response?.data?.message || "Failed to update details. Please check inputs.");
        } finally {
            setLoading(false);
        }
    };

    // Render Fields dynamically depending on the research type using robust CSS Grid
    const renderFormFields = () => {
        const t = type.toLowerCase().replace(/[\s\.]+/g, "");

        switch (t) {
            case "journal":
                return (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" }, gap: 2.5 }}>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Paper Title" name="paperTitle" value={formData.paperTitle || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Journal Name" name="journalName" value={formData.journalName || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="DOI" name="doi" value={formData.doi || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Journal Type</InputLabel>
                                <Select label="Journal Type" name="journalType" value={formData.journalType || ""} onChange={handleChange}>
                                    <MenuItem value="SCI">SCI</MenuItem>
                                    <MenuItem value="SCIE">SCIE</MenuItem>
                                    <MenuItem value="ESCI">ESCI</MenuItem>
                                    <MenuItem value="None">None</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Scopus</InputLabel>
                                <Select label="Scopus" name="isScopus" value={formData.isScopus || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Quartile</InputLabel>
                                <Select label="Quartile" name="journalQuartile" value={formData.journalQuartile || ""} onChange={handleChange}>
                                    <MenuItem value="Q1">Q1</MenuItem>
                                    <MenuItem value="Q2">Q2</MenuItem>
                                    <MenuItem value="Q3">Q3</MenuItem>
                                    <MenuItem value="Q4">Q4</MenuItem>
                                    <MenuItem value="None">None</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <TextField fullWidth label="Publication Scope" name="publicationScope" value={formData.publicationScope || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Published Month</InputLabel>
                                <Select label="Published Month" name="publishedMonth" value={formData.publishedMonth || ""} onChange={handleChange}>
                                    {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Published Year</InputLabel>
                                <Select label="Published Year" name="publishedYear" value={formData.publishedYear || ""} onChange={handleChange}>
                                    {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Volume" name="vol" value={formData.vol || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Issue" name="issue" value={formData.issue || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="SDGs (comma-separated)" name="sdgs" value={formData.sdgs || ""} onChange={handleChange} variant="outlined" size="small" placeholder="SDG-3, SDG-4" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Apply Incentive</InputLabel>
                                <Select label="Apply Incentive" name="applyIncentive" value={formData.applyIncentive || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Applying Seed Grant</InputLabel>
                                <Select label="Applying Seed Grant" name="applyingSeedGrant" value={formData.applyingSeedGrant || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="AGEC Referencing Numbers" name="agecReferencingNumbers" value={formData.agecReferencingNumbers || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="No. of References in AGEC" name="numberOfReferencesBelongingToAGEC" type="number" value={formData.numberOfReferencesBelongingToAGEC !== undefined ? formData.numberOfReferencesBelongingToAGEC : ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Journal H-Index" name="hIndex" value={formData.hIndex || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Impact Factor (JCR)" name="jcrImpactFactor" value={formData.jcrImpactFactor || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Citations" name="citations" type="number" value={formData.citations || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                    </Box>
                );

            case "textbook":
                return (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" }, gap: 2.5 }}>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Book Title" name="title" value={formData.title || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Publisher" name="publisher" value={formData.publisher || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="ISBN" name="isbn" value={formData.isbn || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Edition" name="edition" value={formData.edition || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Cost" name="cost" value={formData.cost || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Publication Scope" name="publicationScope" value={formData.publicationScope || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <TextField fullWidth label="Total Authors" name="totalAuthors" type="number" value={formData.totalAuthors || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <TextField fullWidth label="Applicant Position" name="userAuthorPosition" type="number" value={formData.userAuthorPosition || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Published Month</InputLabel>
                                <Select label="Published Month" name="month" value={formData.month || ""} onChange={handleChange}>
                                    {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Published Year</InputLabel>
                                <Select label="Published Year" name="year" value={formData.year || ""} onChange={handleChange}>
                                    {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Apply Incentive</InputLabel>
                                <Select label="Apply Incentive" name="applyIncentive" value={formData.applyIncentive || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        {renderArrayEditor('authors', 'Authors', 'authorPosition')}
                    </Box>
                );

            case "bookchapter":
            case "book-chapter":
                return (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" }, gap: 2.5 }}>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Book Name" name="textBookName" value={formData.textBookName || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Chapter Title" name="chapterTitle" value={formData.chapterTitle || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Publisher" name="publisher" value={formData.publisher || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="ISBN" name="isbnNumber" value={formData.isbnNumber || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="DOI" name="doi" value={formData.doi || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Publication Scope</InputLabel>
                                <Select label="Publication Scope" name="publicationScope" value={formData.publicationScope || ""} onChange={handleChange}>
                                    <MenuItem value="National">National</MenuItem>
                                    <MenuItem value="International">International</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <TextField fullWidth label="Total Authors" name="totalAuthors" value={formData.totalAuthors || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <TextField fullWidth label="Applicant Position" name="userAuthorPosition" value={formData.userAuthorPosition || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Published Month</InputLabel>
                                <Select label="Published Month" name="month" value={formData.month || ""} onChange={handleChange}>
                                    {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Published Year</InputLabel>
                                <Select label="Published Year" name="year" value={formData.year || ""} onChange={handleChange}>
                                    {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Apply Incentive</InputLabel>
                                <Select label="Apply Incentive" name="applyIncentive" value={formData.applyIncentive || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Applying Seed Grant</InputLabel>
                                <Select label="Applying Seed Grant" name="applyingSeedGrant" value={formData.applyingSeedGrant || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        {renderArrayEditor('coAuthors', 'Co-Authors', 'authorPosition')}
                    </Box>
                );

            case "patent":
                return (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" }, gap: 2.5 }}>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Patent Title" name="title" value={formData.title || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Applicant Name" name="applicantName" value={formData.applicantName || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Patent Name" name="patentName" value={formData.patentName || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Area" name="area" value={formData.area || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Filing Number" name="filingNo" value={formData.filingNo || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField
                                fullWidth
                                label="Date of Filing"
                                name="dateOfFiling"
                                type="date"
                                value={formData.dateOfFiling ? new Date(formData.dateOfFiling).toISOString().split("T")[0] : ""}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                variant="outlined"
                                size="small"
                            />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Patent Status</InputLabel>
                                <Select label="Patent Status" name="patentStatus" value={formData.patentStatus || ""} onChange={handleChange}>
                                    <MenuItem value="Filed">Filed</MenuItem>
                                    <MenuItem value="Published">Published</MenuItem>
                                    <MenuItem value="Granted">Granted</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Apply Incentive</InputLabel>
                                <Select label="Apply Incentive" name="applyIncentive" value={formData.applyIncentive || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Applying Seed Grant</InputLabel>
                                <Select label="Applying Seed Grant" name="applyingSeedGrant" value={formData.applyingSeedGrant || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        {renderArrayEditor('coInventors', 'Co-Inventors')}
                    </Box>
                );

            case "fundedproject":
            case "funded-project":
                return (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" }, gap: 2.5 }}>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Project Title" name="title" value={formData.title || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Funding Agency" name="fundingAgency" value={formData.fundingAgency || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Scheme" name="scheme" value={formData.scheme || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Duration" name="duration" value={formData.duration || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Sanctioned Amount (in Lakhs)" name="sanctionedAmount" value={formData.sanctionedAmount || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField
                                fullWidth
                                label="Sanction Date"
                                name="sanctionDate"
                                type="date"
                                value={formData.sanctionDate ? new Date(formData.sanctionDate).toISOString().split("T")[0] : ""}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                variant="outlined"
                                size="small"
                            />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Project Status</InputLabel>
                                <Select label="Project Status" name="projectStatus" value={formData.projectStatus || ""} onChange={handleChange}>
                                    <MenuItem value="Shortlisted">Shortlisted</MenuItem>
                                    <MenuItem value="Sanctioned">Sanctioned</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Investigator Role</InputLabel>
                                <Select label="Investigator Role" name="investigatorType" value={formData.investigatorType || ""} onChange={handleChange}>
                                    <MenuItem value="Principal Investigator (PI)">Principal Investigator (PI)</MenuItem>
                                    <MenuItem value="Co-Principal Investigator (Co-PI)">Co-Principal Investigator (Co-PI)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Apply Incentive</InputLabel>
                                <Select label="Apply Incentive" name="applyIncentive" value={formData.applyIncentive || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Applying Seed Grant</InputLabel>
                                <Select label="Applying Seed Grant" name="applyingSeedGrant" value={formData.applyingSeedGrant || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        {renderArrayEditor('coInvestigators', 'Co-Investigators')}
                    </Box>
                );

            case "consultancy":
                return (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" }, gap: 2.5 }}>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Consultancy Title" name="title" value={formData.title || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Funding Agency" name="fundingAgency" value={formData.fundingAgency || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Amount (₹)" name="amount" value={formData.amount || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Duration" name="duration" value={formData.duration || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Consultancy Status</InputLabel>
                                <Select label="Consultancy Status" name="projectStatus" value={formData.projectStatus || ""} onChange={handleChange}>
                                    <MenuItem value="Shortlisted">Shortlisted</MenuItem>
                                    <MenuItem value="Sanctioned">Sanctioned</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Investigator Role</InputLabel>
                                <Select label="Investigator Role" name="investigatorType" value={formData.investigatorType || ""} onChange={handleChange}>
                                    <MenuItem value="Principal Investigator (PI)">Principal Investigator (PI)</MenuItem>
                                    <MenuItem value="Co-Principal Investigator (Co-PI)">Co-Principal Investigator (Co-PI)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Apply Incentive</InputLabel>
                                <Select label="Apply Incentive" name="applyIncentive" value={formData.applyIncentive || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Applying Seed Grant</InputLabel>
                                <Select label="Applying Seed Grant" name="applyingSeedGrant" value={formData.applyingSeedGrant || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        {renderArrayEditor('coInvestigators', 'Co-Investigators')}
                    </Box>
                );

            case "conference":
                return (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" }, gap: 2.5 }}>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Paper Title" name="title" value={formData.title || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Conference Name" name="conferenceName" value={formData.conferenceName || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Publisher" name="publisher" value={formData.publisher || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="DOI" name="doi" value={formData.doi || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="ISSN / ISBN" name="issnIsbn" value={formData.issnIsbn || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Conference Scope</InputLabel>
                                <Select label="Conference Scope" name="scope" value={formData.scope || ""} onChange={handleChange}>
                                    <MenuItem value="National">National</MenuItem>
                                    <MenuItem value="International">International</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <TextField fullWidth label="Indexing" name="indexing" value={formData.indexing || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Presentation Type</InputLabel>
                                <Select label="Presentation Type" name="presentationType" value={formData.presentationType || ""} onChange={handleChange}>
                                    <MenuItem value="Oral">Oral</MenuItem>
                                    <MenuItem value="Poster">Poster</MenuItem>
                                    <MenuItem value="Keynote">Keynote</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <TextField fullWidth label="Total Authors" name="totalAuthors" type="number" value={formData.totalAuthors || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <TextField fullWidth label="Applicant Position" name="userAuthorPosition" type="number" value={formData.userAuthorPosition || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Published Month</InputLabel>
                                <Select label="Published Month" name="month" value={formData.month || ""} onChange={handleChange}>
                                    {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Published Year</InputLabel>
                                <Select label="Published Year" name="year" value={formData.year || ""} onChange={handleChange}>
                                    {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Apply Incentive</InputLabel>
                                <Select label="Apply Incentive" name="applyIncentive" value={formData.applyIncentive || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Applying Seed Grant</InputLabel>
                                <Select label="Applying Seed Grant" name="applyingSeedGrant" value={formData.applyingSeedGrant || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        {renderArrayEditor('coAuthors', 'Co-Authors', 'authorPosition')}
                    </Box>
                );

            case "novelproduct":
            case "novel-product":
                return (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" }, gap: 2.5 }}>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Product Name" name="productName" value={formData.productName || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Description" name="description" multiline rows={3} value={formData.description || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Category</InputLabel>
                                <Select label="Category" name="category" value={formData.category || ""} onChange={handleChange}>
                                    <MenuItem value="Developed">Developed</MenuItem>
                                    <MenuItem value="Implemented">Implemented</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            {formData.category === "Developed" ? (
                                <TextField fullWidth label="Developed Organization" name="developedOrganization" value={formData.developedOrganization || ""} onChange={handleChange} variant="outlined" size="small" />
                            ) : (
                                <TextField fullWidth label="Implemented Organization" name="implementedOrganization" value={formData.implementedOrganization || ""} onChange={handleChange} variant="outlined" size="small" />
                            )}
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Investigator Role</InputLabel>
                                <Select label="Investigator Role" name="investigatorType" value={formData.investigatorType || ""} onChange={handleChange}>
                                    <MenuItem value="Principal Investigator (PI)">Principal Investigator (PI)</MenuItem>
                                    <MenuItem value="Co-Principal Investigator (Co-PI)">Co-Principal Investigator (Co-PI)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Apply Incentive</InputLabel>
                                <Select label="Apply Incentive" name="applyIncentive" value={formData.applyIncentive || ""} onChange={handleChange}>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: "span 12" }}>
                            <TextField fullWidth label="Remarks" name="remarks" value={formData.remarks || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        {renderArrayEditor('coDevelopers', 'Co-Developers')}
                    </Box>
                );

            case "phdscholar":
            case "phd-scholar":
                return (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" }, gap: 2.5 }}>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Roll Number" name="rollNumber" value={formData.rollNumber || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Student Name" name="studentName" value={formData.studentName || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Course" name="course" value={formData.course || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="Branch" name="branch" value={formData.branch || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField fullWidth label="University" name="university" value={formData.university || ""} onChange={handleChange} variant="outlined" size="small" />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <TextField
                                fullWidth
                                label="Admission or Award Date"
                                name="admissionOrAwardDate"
                                type="date"
                                value={formData.admissionOrAwardDate ? new Date(formData.admissionOrAwardDate).toISOString().split("T")[0] : ""}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                variant="outlined"
                                size="small"
                            />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Scholar Status</InputLabel>
                                <Select label="Scholar Status" name="scholarStatus" value={formData.scholarStatus || ""} onChange={handleChange}>
                                    <MenuItem value="Pursuing">Pursuing</MenuItem>
                                    <MenuItem value="Awarded">Awarded</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Scholar Type</InputLabel>
                                <Select label="Scholar Type" name="scholarType" value={formData.scholarType || ""} onChange={handleChange}>
                                    <MenuItem value="Full-Time">Full-Time</MenuItem>
                                    <MenuItem value="Part-Time">Part-Time</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                );

            default:
                return <Typography color="error">Form fields not defined for type: {type}</Typography>;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ "& .MuiDialog-paper": { borderRadius: "20px", bgcolor: "var(--bg-panel)", border: "1px solid var(--border-color)" } }}>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", fontSize: "1rem" }}>
                    Edit {type} Details
                </Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: "var(--text-secondary)" }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ mt: 2, pb: 4 }}>
                {renderFormFields()}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={onClose} sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    sx={{ bgcolor: "var(--color-primary)", color: "#fff", fontWeight: 800, px: 3, "&:hover": { opacity: 0.9 } }}
                >
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditResearchDetailsDialog;
