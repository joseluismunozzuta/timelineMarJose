import os

def convert_file_url_to_path(file_url, root_dir):
    # Remove "file://" prefix
    #file_url = file_url[7:]
    # Remove root directory and replace backslashes with slashes
    rel_path = file_url.replace("\\", "/")
    image_url = f'assets/{rel_path}'
    return image_url

def find_image_paths(root_dir):
    image_paths = []
    for folder, _, files in os.walk(root_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')):
                image_path = os.path.join(folder, file)
                image_paths.append(image_path)
    return image_paths

if __name__ == '__main__':
    root_directory = 'img'  # Update this to the root directory of your image structure
    image_urls = find_image_paths(root_directory)

    for image_url in image_urls:
        relative_path = convert_file_url_to_path(image_url, root_directory)
        print(f'"{relative_path}",')