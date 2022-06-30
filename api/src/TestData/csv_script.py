import argparse
import csv

parser = argparse.ArgumentParser()
parser.add_argument("-f", "--openFile", type=str)
parser.add_argument("-s", "--saveFile", type=str)
parser.add_argument("-r", "--row", type=str)

args = parser.parse_args()
file_path = args.openFile()
save_path = args.saveFile()
row_to_add = args.row()

with open(file_path, 'r') as csv_input:
    with open(save_path, 'w') as csv_output:
        w = csv.writer(csv_output, lineterminator='\n')
        r = csv.reader(csv_input)

        alls: list = []
        row = next(r)
        row.append()
        alls.append(row_to_add)

        for row in r:
            row.append(row[0])
            alls.append(row)

        w.writerows(alls)
