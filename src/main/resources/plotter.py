import pandas as pd
import plotly.express as px
import os

dataFolderPath = os.getcwd()
data = pd.read_csv(dataFolderPath + "/log.csv")

df = {
    'n': [],
    'b': [],
    's': [],
}

for entry in data.values:
    df['n'].append(entry[0])
    df['b'].append(entry[1])
    df['s'].append(entry[2])

df = pd.DataFrame(df)

fig1 = px.scatter(
    df,
    x='n',
    y='b',
    color='s',
    labels={"n": "Bet Round", "b": "Balance", "s": "Strategy"},
)
fig1.write_html("plot.html")
