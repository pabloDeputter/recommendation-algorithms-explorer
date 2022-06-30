// React
import React, {useState} from 'react';
import DataTable from 'react-data-table-component';
// HeroIcons
import {ChevronDownIcon} from '@heroicons/react/solid';
// Bootstrap
import Spinner from "react-bootstrap/Spinner";
// Stuff

// Docs from react-data-table-component
// COLUMNS -- https://react-data-table-component.netlify.app/?path=/docs/api-columns--page
// REMOTE-SORT -- https://react-data-table-component.netlify.app/?path=/docs/sorting-remote-sort--remote-sort

const Table = (props) => {


    const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

    return (
        <DataTable
            responsive

            progressComponent={<Spinner animation="border" role="status"/>}
            highlightOnHover

            // expandableRows
            // expandableRowsComponent={Expanded}
            expandOnRowClicked

            fixedHeader
            fixedHeaderScrollHeight="600px"

            sortIcon={<ChevronDownIcon style={{color: "#757575"}}/>}
            pagination
            paginationResetDefaultPage={resetPaginationToggle}

            // paginationTotalRows={5}


            //subHeader
            //subHeaderComponent={SearchBarMemo}
            {...props}
            data={props.data}
        />
    )
}

export default Table;