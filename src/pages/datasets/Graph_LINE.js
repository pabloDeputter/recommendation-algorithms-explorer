import React from "react";
import {Line} from "react-chartjs-2";
import {Chart as ChartJS, registerables} from "chart.js";

ChartJS.register(...registerables)

export function Graph_LINE({chartData}) {
    return <Line data={chartData}/>;
}

export function Spend_per_day_graph({data_, range}) {
    const x = {
        labels: data_.slice(range[0], range[1] + 1).map((data) => new Date(data['purchase_date']).toISOString().split('T')[0]),
        datasets: [
            {
                label: "spend per day",
                data: data_.slice(range[0], range[1] + 1).map((data) => data['revenue']),
                backgroundColor: [
                    'rgb(80,120,205)'
                ],
                borderColor: "black",
                borderWidth: 1,
            }
        ],
    }
    return <Line data={x}/>;
}

export function Purchases_per_day_graph({data_, range}) {
    const x = {
        labels: data_.slice(range[0], range[1] + 1).map((data) => new Date(data['purchase_date']).toISOString().split('T')[0]),
        datasets: [
            {
                label: "bought per day",
                data: data_.slice(range[0], range[1] + 1).map((data) => data['bought']),
                backgroundColor: [
                    'rgb(80,120,205)'
                ],
                borderColor: "black",
                borderWidth: 1,
            }
        ],
    }
    return <Line data={x}/>;
}
