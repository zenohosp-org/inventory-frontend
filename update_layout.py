import re
import glob

files = glob.glob("/Users/iniyananbu/Documents/ZenoHosp Apps/Inventory/inventory-frontend/src/**/*.jsx", recursive=True)

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    if 'className="main-content"' not in content:
        continue

    print(f"Processing {file_path}")
    content = content.replace('className="main-content"', 'className="zu-page"')

    if "PageHeader" not in content:
        # PageSkeleton.jsx
        # wrap everything inside the div
        last_div_match = list(re.finditer(r"</div>\s*\)?\s*;", content))
        if last_div_match:
            last_div = last_div_match[-1].start()
            # find first > after zu-page
            first_gt = content.find(">", content.find('className="zu-page"'))
            content = content[:first_gt+1] + "\n<div className=\"zu-page-content\">\n" + content[first_gt+1:last_div] + "\n</div>\n" + content[last_div:]
            with open(file_path, "w") as f: f.write(content)
        continue

    # Find the end of PageHeader
    # PageHeader might end with /> or </PageHeader>
    # We will find the index of "PageHeader"
    ph_start = content.find("<PageHeader")
    if ph_start == -1: continue

    # find the matching closing tag
    # basically find the next /> or </PageHeader> at the same level
    idx = ph_start
    in_str = False
    in_jsx = 0
    end_idx = -1
    for i in range(ph_start, len(content)):
        if content[i] == '"' or content[i] == "'":
            if i > 0 and content[i-1] != "\\":
                in_str = not in_str
        elif not in_str:
            if content[i] == '{': in_jsx += 1
            elif content[i] == '}': in_jsx -= 1
            elif in_jsx == 0:
                if content[i:i+2] == '/>':
                    end_idx = i + 2
                    break
                if content[i:i+14] == '</PageHeader>':
                    end_idx = i + 14
                    break

    if end_idx != -1:
        # Find the last closing div of the return statement
        last_div_match = list(re.finditer(r"</div>\s*\)?\s*;", content))
        if not last_div_match:
            last_div_match = list(re.finditer(r"</div>\s*\n\s*\)\s*;", content))
        if not last_div_match:
            last_div_match = list(re.finditer(r"</div>\s*</", content))
        
        if last_div_match:
            last_div = last_div_match[-1].start()
            content = content[:end_idx] + "\n            <div className=\"zu-page-content\">\n" + content[end_idx:last_div] + "            </div>\n        " + content[last_div:]
            with open(file_path, "w") as f: f.write(content)
            print("Successfully updated")
        else:
            print("Could not find last div")
    else:
        print("Could not find end of PageHeader")

