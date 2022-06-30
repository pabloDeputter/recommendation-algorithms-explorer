// React
import React, {lazy} from 'react';
// Icons
import {BeakerIcon, DatabaseIcon, PlusCircleIcon, ViewListIcon} from '@heroicons/react/solid';


// AB-Test
const CreateTest = lazy(() => import('../pages/ABtest/CreateABTest'));
const RenderTest = lazy(() => import('../pages/ABtest/RenderABTest'));
const TestRender = lazy(() => import('../pages/testRender/TestRender'))

// Datasets
const UploadDataset = lazy(() => import('../pages/datasets/UploadDataset'));
const DatasetsOverview = lazy(() => import('../pages/datasets/DatasetsOverview'));
const DatasetsTables = lazy(() => import('../pages/datasets/DatasetsTables'));

// Items
const ItemPage = lazy(() => import('../pages/items/ItemPage'));
const ItemTestPage = lazy(() => import('../pages/items/ItemTestPage'));

// Users
const UserPage = lazy(() => import('../pages/users/UserPage'));
const UserTestPage = lazy(() => import('../pages/users/UserTestPage'));

// All the routes are here defined that will be used across the App. Routes with a
// 'name' and an 'icon' appear in the sidebar. When such a route has 'sub_routes', these
// subroutine's will rendered as dropdown items in the sidebar.
const routes = [
    {
        name: 'A/B Tests',
        icon: <BeakerIcon className='sidebar-icon'/>,
        path: 'test',
        sub_routes: [
            {
                name: 'Create Test',
                icon: <PlusCircleIcon className='sidebar-icon'/>,
                component: CreateTest,
                path: 'test/create'
            },
            {
                name: 'Render Test',
                icon: <BeakerIcon className='sidebar-icon'/>,
                component: RenderTest,
                path: 'tests',
            },
        ]
    },
    {
        name: 'Datasets',
        icon: <DatabaseIcon className='sidebar-icon'/>,
        component: DatasetsOverview,
        path: 'datasets/*',
        sub_routes: [
            {
                name: 'Upload',
                icon: <PlusCircleIcon className='sidebar-icon'/>,
                component: UploadDataset,
                path: 'datasets/upload'
            },
            {
                name: 'Overview',
                icon: <ViewListIcon className='sidebar-icon'/>,
                component: DatasetsOverview,
                path: 'datasets/overview',
            },
        ]
    },
    {
        component: TestRender,
        path: ':dataset_name/test/:test_id'
    },
    {
        component: DatasetsTables,
        path: '/dataset/:dataset_name'
    },
    {
        component: ItemPage,
        path: ':dataset_name/items/:item_id'
    },
    {
        component: ItemTestPage,
        path: ':dataset_name/test/:test_id/items/:item_id'
    },
    {
        component: UserPage,
        path: ':dataset_name/users/:user_id'
    },
    {
        component: UserTestPage,
        path: ':dataset_name/test/:test_id/users/:user_id'
    }
]

export default routes;