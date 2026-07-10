import os
import re

files_to_check = []
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            files_to_check.append(os.path.join(root, file))

for fpath in files_to_check:
    with open(fpath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Dashboard and PurchaseOrdersPage have <div className="table-body">
    if 'PurchaseOrdersPage.jsx' in fpath:
        content = content.replace('className="table-body"', 'className="zu-table-wrapper"')
        content = content.replace('className="table"', 'className="zu-table"')
    
    if 'Dashboard.jsx' in fpath:
        content = content.replace('className="table-body"', 'className="zu-table-wrapper"')
        # Dashboard also has table-empty in table-body, let's just make sure it looks ok.
    
    # ReceiveQuantityModal
    if 'ReceiveQuantityModal.jsx' in fpath:
        content = content.replace('<table className="w-full text-sm">', '<div className="zu-table-wrapper"><table className="zu-table">')
        content = content.replace('</table>', '</table></div>')

    # KitDetailPanel
    if 'KitDetailPanel.jsx' in fpath:
        content = content.replace('<table className="kit-components-table">', '<div className="zu-table-wrapper"><table className="zu-table">')
        content = content.replace('</table>', '</table></div>')
        
    # ConsumeKitModal
    if 'ConsumeKitModal.jsx' in fpath:
        content = content.replace('<table style={{ width: \'100%\', fontSize: \'0.85rem\' }}>', '<div className="zu-table-wrapper"><table className="zu-table">')
        content = content.replace('</table>', '</table></div>')
        
    # PODetailPanel
    if 'PODetailPanel.jsx' in fpath:
        content = content.replace('<table className="po-detail-items">', '<div className="zu-table-wrapper"><table className="zu-table">')
        content = content.replace('</table>', '</table></div>')

    if content != original:
        with open(fpath, 'w') as f:
            f.write(content)
        print(f"Updated {fpath}")

