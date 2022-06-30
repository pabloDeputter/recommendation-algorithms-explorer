import {Link} from "react-router-dom";
import React from "react";

export const ItemColumns = (dataset_name, test_id) => {
    const columnPurchases = [
        {
            name: 'user_id',
            selector: row => row.user_id,
            sortable: true,
            cell: row => (
                test_id === undefined
                    ?
                    <Link style={{textDecoration: 'none'}}
                          to={`/dashboard/${dataset_name}/users/${row.user_id}`}>{row.user_id}
                    </Link>
                    :
                    <Link style={{textDecoration: 'none'}}
                          to={`/dashboard/${dataset_name}/test/${test_id}/users/${row.user_id}`}>{row.user_id}
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

    return {columnPurchases}
}