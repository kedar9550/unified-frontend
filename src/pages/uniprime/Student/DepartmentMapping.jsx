import React from 'react';
import { Box } from "@mui/material";
import { SwapHoriz as MappingIcon } from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";

const DepartmentMapping = () => {
    return (
        <Box sx={{ px: { xs: 0.5, sm: 1 }, py: { xs: 2, sm: 3 } }}>
            <PageHeader
                title="Students Department Mapping"
                subtitle="Assign students to specific departments"
                icon={<MappingIcon sx={{ color: "#fff" }} />}
            />

            {/* Mapping configuration UI will go here */}
        </Box>
    );
};

export default DepartmentMapping;