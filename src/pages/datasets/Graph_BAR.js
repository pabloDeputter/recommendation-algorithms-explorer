import React from "react";
import {Doughnut} from "react-chartjs-2";
import {Chart as ChartJS, registerables} from "chart.js";

ChartJS.register(...registerables)

// import { Chart as ChartJS } from "chart.js/auto";

export function Graph_BAR({chartData}) {
    return <Doughnut data={chartData}/>;
}

export function Item_and_user_graph({chartData1, chartData2, name}) {
    // const x = {
    //     labels: [name],
    //     datasets: [
    //         {
    //             label: "amount of items",
    //             data: [chartData1],
    //             backgroundColor: [
    //                 "rgba(75,192,192,1)"
    //             ],
    //             borderColor: "black",
    //             borderWidth: 1,
    //         },
    //         {
    //             label: "amount of users",
    //             data: [chartData2],
    //             backgroundColor: [
    //                 "rgb(241,240,236)"
    //             ],
    //             borderColor: "black",
    //             borderWidth: 1,
    //         },
    //     ],
    // }
    let delayed;
    const x = {
        options: {
            fill: true,
            maintainAspectRatio: true,
            responsive: true,
        },
        labels: [
            'Amount of items',
            'Amount of users'
        ],
        datasets: [
            {
                label: {name},
                data: [chartData1, chartData2],
                backgroundColor: [
                    "rgb(80,120,205)",
                    "rgb(80,205,155)"
                ],
                hoverOffset: 5
            }
        ]
    }


    return <Doughnut data={x}/>;
}
