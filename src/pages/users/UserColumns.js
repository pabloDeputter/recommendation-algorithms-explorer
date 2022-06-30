import {Link} from "react-router-dom";
import React from "react";
import {ValidUrl} from "../../utils/ValidUrl";

export const UserColumns = (dataset_name, test_id) => {
    // Check if metadata item is an url, if it is an url render it
    const urlToImage = (to_check) => {
        console.log(to_check);
        if (ValidUrl(to_check)) {
            return <img src={to_check} alt='item image'/>
        }
        return null;
    }

    // Columns for user purchases
    const columnPurchases = [
        {
            name: 'item_id',
            selector: row => row.item_id,
            sortable: true,
            cell: row => (
                test_id === undefined
                    ?
                    <Link style={{textDecoration: 'none'}}
                          to={`/dashboard/${dataset_name}/items/${row.item_id}`}>{row.item_id}
                    </Link>
                    :
                    <Link style={{textDecoration: 'none'}}
                          to={`/dashboard/${dataset_name}/test/${test_id}/items/${row.item_id}`}>{row.item_id}
                    </Link>
            )
        },
        {
            name: 'price',
            selector: row => row.price,
            sortable: true,
        },
        {
            name: 'purchase_date',
            selector: row => new Date(row.purchase_date).toISOString().split('T')[0],
            sortable: true
        }
    ];
    // Columns for user recommendations
    const columnRecommendations = [
        {
            name: 'rank',
            selector: row => row.rank,
            sortable: true,
        },
        {
            name: 'item_id',
            selector: row => row.item_id,
            sortable: true,
            cell: row => (
                test_id === undefined
                    ?
                    <Link style={{textDecoration: 'none'}}
                          to={`/dashboard/${dataset_name}/items/${row.item_id}`}>{row.item_id}
                    </Link>
                    :
                    <Link style={{textDecoration: 'none'}}
                          to={`/dashboard/${dataset_name}/test/${test_id}/items/${row.item_id}`}>{row.item_id}
                    </Link>
            )
        },
        {
            name: 'day',
            selector: row => new Date(row.day).toISOString().split('T')[0],
            sortable: true,
        },
    ]
    return {columnPurchases, columnRecommendations}
}