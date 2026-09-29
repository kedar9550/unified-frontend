import os, glob, re
dir_path = r'd:/W/Unified/unified-frontend/src/pages/faculty'
files = glob.glob(os.path.join(dir_path, '*.jsx'))

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'data.approvedAmount) && (' in content:
        continue
        
    start_idx = content.find('{(data.hodComment || data.rndComment) && (')
    if start_idx == -1:
        continue
        
    # Find the end of this block
    # We look for the closing </Box> )} for rndComment and then the closing </Box> )} for the whole block
    end_idx = content.find(')}', content.find('{data.rndComment && (', start_idx) + 20)
    end_idx = content.find(')}', end_idx + 2)
    
    if end_idx != -1:
        block = content[start_idx:end_idx+2]
        
        # Now we replace the block
        new_block = block.replace('{(data.hodComment || data.rndComment) && (', '{(data.hodComment || data.rndComment || data.approvedAmount) && (')
        
        rnd_comment_start = new_block.find('{data.rndComment && (')
        if rnd_comment_start != -1:
            # We want to replace {data.rndComment && ( with {(data.rndComment || data.approvedAmount) && (
            new_block = new_block[:rnd_comment_start] + '{(data.rndComment || data.approvedAmount) && (\n                <Box sx={{ p: 2, bgcolor: "rgba(76, 175, 80, 0.05)", borderRadius: "10px", border: "1px solid rgba(76, 175, 80, 0.2)" }}>\n                  {data.rndComment && (\n                    <>\n                      <Typography variant="caption" sx={{ fontWeight: 900, color: "#4caf50", textTransform: "uppercase" }}>R&D Remarks</Typography>\n                      <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)" }}>"{data.rndComment}"</Typography>\n                    </>\n                  )}\n                  {data.approvedAmount && (\n                    <Typography variant="h6" sx={{ mt: data.rndComment ? 2 : 0, fontWeight: 900, color: "#10b981" }}>\n                      Approved Amount: ₹{data.approvedAmount}\n                    </Typography>\n                  )}\n                </Box>\n              )}'
            
            # Now remove the old {data.rndComment && ( ... )} block
            rnd_comment_end = new_block.find(')}', new_block.find(')}', new_block.find('{data.approvedAmount && (')) + 2)
            # Actually, this is too fragile.
