import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import React, {useEffect, useState} from "react";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import {Container} from "react-bootstrap";
import {CardComponent} from "../../components";


function UploadDataset() {
    // Dataset
    const [file, setFile] = useState(null);
    const [datasetHeaders, setDatasetHeaders] = useState([]);
    const [name, setName] = useState(null);
    const [description, setDescription] = useState(null);
    const [datasetColumns, setDatasetColumns] = useState({
        "purchase_date": null,
        "user_id": null,
        "item_id": null,
        "price": null,
    });
    // Metadata
    const [userMetadata, setUserMetadata] = useState(null);
    const [itemMetadata, setItemMetadata] = useState(null);
    const [userMetadataHeaders, setUserMetadataHeaders] = useState([]);
    const [itemMetadataHeaders, setItemMetadataHeaders] = useState([]);
    const [userMetadataPK, setUserMetadataPK] = useState(null);
    const [itemMetadataPK, setItemMetadataPK] = useState(null);
    const [itemMetadataName, setItemMetadataName] = useState(null);
    const [userMetadataTypes, setUserMetadataTypes] = useState({});
    const [itemMetadataTypes, setItemMetadataTypes] = useState({});
    // Page state
    const [loading, setLoading] = useState(false); // Indicates whether or not there are still API requests running
    // File readers
    const fileReader = new FileReader();
    const metadataReader = new FileReader();

    /**
     * Returns a copy of given dictionary with the key set to the given value
     * @param dictionary dictionary
     * @param key to set the value to
     * @param value value to set
     * @returns {any} copy of the given dictionary with the given key value pair
     */
    function setDictEntry(dictionary, key, value) {
        dictionary[key] = value;
        return JSON.parse(JSON.stringify(dictionary));
    }

    /**
     * Reads headers from metadata to display the header type settings
     * @param metadataFile metadata file to read headers from
     * @param setHeaders function to set headers
     */
    function selectMetadata(metadataFile, setHeaders) {
        setHeaders([]);
        if (metadataFile) {
            metadataReader.onload = function (event) {
                const csvOutput = event.target.result;
                setHeaders(csvOutput.slice(0, csvOutput.indexOf("\n")).split(","));
            };
            metadataReader.readAsText(metadataFile);
        }
    }

    // Called when metadata CSV files are selected
    useEffect(() => selectMetadata(userMetadata, setUserMetadataHeaders), [userMetadata]);
    useEffect(() => selectMetadata(itemMetadata, setItemMetadataHeaders), [itemMetadata]);
    useEffect(() => {
        setDatasetHeaders([]);
        if (file) {
            fileReader.onload = function (event) {
                const csvOutput = event.target.result;
                const headers = csvOutput.slice(0, csvOutput.indexOf("\n")).split(",");
                datasetColumns.purchase_date = headers[0];
                datasetColumns.item_id = headers[0];
                datasetColumns.user_id = headers[0];
                datasetColumns.price = headers[0];
                setDatasetHeaders(headers);
            };
            fileReader.readAsText(file);
        } else {
            setDatasetHeaders([]);
        }
    }, [file]);

    useEffect(() => {
        userMetadataHeaders.map((value) => userMetadataTypes[value] = "string");
        setUserMetadataTypes(JSON.parse(JSON.stringify(userMetadataTypes)));
        setUserMetadataPK(userMetadataHeaders[0]);
    }, [userMetadataHeaders]);

    useEffect(() => {
        itemMetadataHeaders.map((value) => itemMetadataTypes[value] = "string")
        setItemMetadataTypes(JSON.parse(JSON.stringify(itemMetadataTypes)));
        setItemMetadataPK(itemMetadataHeaders[0]);
        setItemMetadataName(itemMetadataHeaders[0]);
    }, [itemMetadataHeaders]);

    /**
     * Called when the submit button has been pressed
     * @param e Submit event
     */
    const handleOnSubmit = (e) => {
        e.preventDefault();

        if (loading) {
            alert("Please wait!");
            return;
        }

        if (!validateFormData())
            return;

        const formData = new FormData();

        // Append data to the FormData object to submit
        formData.append("dataset_name", name);
        formData.append("dataset_description", description);
        formData.append("dataset_columns", JSON.stringify(datasetColumns));
        formData.append("user_pk", userMetadataPK);
        formData.append("user_types", JSON.stringify(userMetadataTypes));
        formData.append("item_pk", itemMetadataPK);
        formData.append("item_types", JSON.stringify(itemMetadataTypes));
        formData.append("item_name_column", itemMetadataName);
        formData.append("data", file);
        formData.append("user_data", userMetadata);
        formData.append("item_data", itemMetadata);

        setLoading(true);

        axios.post("/dataset", formData, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        })
            .then(() => {
                setFile(null);
                setItemMetadata(null);
                setUserMetadata(null);
                setLoading(false);
                alert("Your dataset has been sent to the server and is now being uploaded. " +
                    "You can find it in the 'Overview' tab when it's ready!");
            })
            .catch(error => {
                if (error.response.data.msg !== "undefined")
                    alert(error.response.data.msg);
                else
                    alert("An error occurred! Please upload a new dataset.");
            })
            .finally(() => {
                setFile(null);
                setItemMetadata(null);
                setUserMetadata(null);
                setLoading(false);
            });
    };

    function validateFormData() {
        if (name == null) {
            alert("Please enter a name for the dataset!");
            return false;
        } else if (!RegExp('^[a-zA-Z][a-zA-Z_]*$').test(name)) {
            alert("Invalid dataset name!");
            return false;
        } else if (!file) {
            alert("Please upload a dataset!");
            return false;
        } else if (file.type !== "text/csv") {
            alert("You can only upload CSV files!");
            return false;
        } else if (userMetadata && userMetadata.type !== "text/csv") {
            alert("You can only upload CSV files!");
            return false;
        } else if (itemMetadata && itemMetadata.type !== "text/csv") {
            alert("You can only upload CSV files!");
            return false;
        } else if ([...new Set(Object.values(datasetColumns))].length !== 4) {
            alert("Please select a unique column name for each dataset field!")
            return false;
        } else if (itemMetadata && itemMetadataName === itemMetadataPK) {
            alert("Please choose a different column for the item metadata name or primary key column!")
            return false;
        }
        return true;
    }

    function getDatasetColumnTypes() {
        return datasetHeaders.length === 0 ? <>{/*Don't display any dropdown menu if there are no headers loaded*/}</> : <>
            {Object.keys(datasetColumns).map(function (key, index) {
                return <div key={index}><Row className={"mb-3"}>
                    <Form.Group as={Col}>
                        <Form.Text>{key}</Form.Text>
                    </Form.Group>
                    <Form.Group as={Col}>
                        <Form.Select
                            onChange={(e) => setDatasetColumns(setDictEntry(datasetColumns, key, e.target.value))}>
                            {datasetHeaders.map((item, index) => <option value={item} key={index}>{item}</option>)};
                        </Form.Select>
                    </Form.Group>
                </Row></div>
            })}
        </>
    }

    function getPrimaryKeySelection(columnNames, setPKColumn) {
        if (columnNames.length === 0) return <></>;
        return (<Row className={"mb-3"}>
            <Form.Group as={Col}>
                <Form.Text>Primary key</Form.Text>
            </Form.Group>
            <Form.Group as={Col}>
                <Form.Select onChange={(e) => setPKColumn(e.target.value)}>
                    {columnNames.map((item, index) => <option value={item} key={index}>{item}</option>)};
                </Form.Select>
            </Form.Group>
        </Row>);
    }

    function getNameSelection(columnNames, setNameColumn) {
        if (columnNames.length === 0) return <></>;
        return (<Row className={"mb-3"}>
            <Form.Group as={Col}>
                <Form.Text>Name column</Form.Text>
            </Form.Group>
            <Form.Group as={Col}>
                <Form.Select onChange={(e) => setNameColumn(e.target.value)}>
                    {columnNames.map((item, index) => <option value={item} key={index}>{item}</option>)};
                </Form.Select>
            </Form.Group>
        </Row>);
    }

    function getColumnTypeSelection(columnNames, columnTypes) {
        return columnNames.map((item, index) => createFieldTypeSelection(item, index, columnTypes));
    }

    function createFieldTypeSelection(fieldName, index, headerTypes) {
        return <div key={index}><Row>
            <Form.Group as={Col}>
                <Form.Text>{fieldName}</Form.Text>
            </Form.Group>
            <Form.Group as={Col}>
                <Form.Select onChange={(e) => headerTypes[fieldName] = e.target.value}>
                    <option value="string">String</option>
                    <option value="numerical">Numerical</option>
                    <option value="url">Image as URL</option>
                </Form.Select>
            </Form.Group>
        </Row></div>;
    }

    function getModalBody() {
        if (loading) {
            return <Spinner animation="border" role="status"/>;
        }

        return (
            <Form className={"pt-3"}>
                <Row className="mb-3">
                    <Form.Group as={Col}>
                        <Form.Control type="text" placeholder="Name" id="name"
                                      onChange={(e) => setName(e.target.value)}/>
                    </Form.Group>

                    <Form.Group as={Col}>
                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])}/>
                        </Form.Group>
                    </Form.Group>
                </Row>
                <Row className="mb-3">
                    <Form.Group>
                        <Form.Control type="text" placeholder="Description"
                                      onChange={(e) => setDescription(e.target.value)}/>
                    </Form.Group>
                </Row>
                {getDatasetColumnTypes()}
                <Row>
                    <Form.Text>
                        User Metadata
                    </Form.Text>
                </Row>
                <Row>
                    <Form.Group as={Col}>
                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Control type="file" onChange={(e) => setUserMetadata(e.target.files[0])}/>
                        </Form.Group>
                    </Form.Group>
                </Row>
                {getPrimaryKeySelection(userMetadataHeaders, setUserMetadataPK)}
                {getColumnTypeSelection(userMetadataHeaders, userMetadataTypes)}
                <Row>
                    <Form.Text>
                        Item Metadata
                    </Form.Text>
                </Row>
                <Row>
                    <Form.Group as={Col}>
                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Control type="file" onChange={(e) => setItemMetadata(e.target.files[0])}/>
                        </Form.Group>
                    </Form.Group>
                </Row>
                {getPrimaryKeySelection(itemMetadataHeaders, setItemMetadataPK)}
                {getNameSelection(itemMetadataHeaders, setItemMetadataName)}
                {getColumnTypeSelection(itemMetadataHeaders, itemMetadataTypes)}
            </Form>);
    }


    return (
        <Container fluid className="mt-0 mt-lg-4">
            <CardComponent
                title='Upload Dataset'
                link=''
                text='Upload a dataset and give it a name and a description. You can also add additional user and item metadata.'
                content=
                    {
                        <Container fluid>
                            <Row className={"mb-3"}>
                                {getModalBody()}
                            </Row>
                            <Row className="justify-content-md-end mb-3">
                                <Button variant="primary" type="submit" onClick={handleOnSubmit}
                                        style={{maxWidth: 200}} disabled={loading}>
                                    Upload
                                </Button>
                            </Row>
                        </Container>
                    }
                rest=''
            />
        </Container>
    )
}

export default UploadDataset;