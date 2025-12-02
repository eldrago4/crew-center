# Event Submission/Save Logic Implementation

## Completed Tasks
- [x] Install @vercel/blob package for image uploads
- [x] Create /api/upload endpoint for banner image uploads to Vercel Blob
- [x] Modify handleModalSave to:
  - Upload banner images to Vercel Blob if a file is selected
  - Generate pushbackTime from pushbackIso with +5:30 offset (IST)
  - Ensure promoted field is saved as boolean
  - Remove temporary bannerFile field before saving
- [x] Update FileUpload component to store actual file for upload
- [x] Update event display to show banner status and pushbackTime
- [x] Update handleAdd to include pushbackTime field
- [x] Update handleEdit to handle existing banner URLs properly

## Remaining Tasks
- [x] Fixed database saving issue - removed JSON.stringify from updateModuleValue function
- [ ] Test the event creation and editing functionality
- [ ] Verify banner image upload works correctly
- [ ] Confirm pushbackTime is generated with correct +5:30 offset
- [ ] Ensure promoted field is saved as boolean in DB
- [ ] Test saving events to database via existing crewcenter API

## Key Features Implemented
- Banner images are uploaded to Vercel Blob and URL stored in event object
- Pushback date/time converted to pushbackTime string with +5:30 offset
- Promoted field saved as boolean attribute
- Events saved as JSON objects in database
