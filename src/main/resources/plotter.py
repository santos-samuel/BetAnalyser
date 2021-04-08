import pandas as pd
import plotly.express as px
import os

dataFolderPath = os.getcwd()
data = pd.read_csv(dataFolderPath + "/log.csv", sep=',')

df = {
    'n': [],
    'b': [],
    's': [],
    'd': [],
}

for entry in data.values:
    try:
        df['n'].append(int(entry[0]))
        df['b'].append(float(entry[1]))
        df['s'].append(str(entry[2]))
        df['d'].append(str(entry[3]))
    except:
        print("An exception occurred")

df = pd.DataFrame(df)

fig1 = px.scatter(
    df,
    x='n',
    y='b',
    color='s',
    hover_name='d',
    labels={"n": "Bet Round", "b": "Balance", "s": "Strategy"},
)
fig1.write_html("plot.html")
print("Plot done")
